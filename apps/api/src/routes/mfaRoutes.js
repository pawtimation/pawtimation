import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { storage } from '../storage.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export default async function mfaRoutes(fastify, options) {
  
  async function requireAuth(req, reply) {
    try {
      const token = req.cookies?.token || req.cookies?.owner_token || (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) {
        reply.code(401).send({ error: 'unauthenticated' });
        return null;
      }
      
      const payload = fastify.jwt.verify(token);
      const user = await storage.getUserById(payload.sub);
      
      if (!user) {
        reply.code(401).send({ error: 'unauthenticated' });
        return null;
      }
      
      return { user };
    } catch (err) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
  }

  fastify.post('/mfa/setup', async (req, reply) => {
    const auth = await requireAuth(req, reply);
    if (!auth) return;

    const { user } = auth;

    if (user.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({ error: 'Only platform owners can enable MFA' });
    }

    if (user.mfaEnabled) {
      return reply.code(400).send({ error: 'MFA already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `Pawtimation (${user.email})`,
      issuer: 'Pawtimation'
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    const encryptedSecret = encrypt(secret.base32);

    return {
      qrCode: qrCodeUrl,
      encryptedSecret
    };
  });

  fastify.post('/mfa/verify-setup', async (req, reply) => {
    const auth = await requireAuth(req, reply);
    if (!auth) return;

    const { user } = auth;
    const { token, encryptedSecret } = req.body;

    if (user.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({ error: 'Only platform owners can enable MFA' });
    }

    if (!token || !encryptedSecret) {
      return reply.code(400).send({ error: 'Token and encrypted secret required' });
    }

    const secret = decrypt(encryptedSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return reply.code(400).send({ error: 'Invalid verification code' });
    }

    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    const secretForStorage = encrypt(secret);

    await storage.updateUser(user.id, {
      mfaSecret: secretForStorage,
      mfaEnabled: true,
      mfaBackupCodes: hashedBackupCodes
    });

    console.log(`[MFA] Enabled for user ${user.email}`);

    return {
      success: true,
      backupCodes
    };
  });

  fastify.post('/mfa/disable', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '15 minutes'
      }
    }
  }, async (req, reply) => {
    const auth = await requireAuth(req, reply);
    if (!auth) return;

    const { user } = auth;
    const { password } = req.body;

    if (user.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({ error: 'Only platform owners can disable MFA' });
    }

    if (!password) {
      return reply.code(400).send({ error: 'Password required to disable MFA' });
    }

    const bcrypt = await import('bcryptjs');
    const passwordValid = await bcrypt.default.compare(password, user.password);

    if (!passwordValid) {
      return reply.code(400).send({ error: 'Invalid password' });
    }

    await storage.updateUser(user.id, {
      mfaSecret: null,
      mfaEnabled: false,
      mfaBackupCodes: null
    });

    console.log(`[MFA] Disabled for user ${user.email}`);

    return { success: true };
  });

  fastify.post('/mfa/regenerate-backup-codes', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour'
      }
    }
  }, async (req, reply) => {
    const auth = await requireAuth(req, reply);
    if (!auth) return;

    const { user } = auth;
    const { password } = req.body;

    if (user.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({ error: 'Only platform owners can regenerate backup codes' });
    }

    if (!user.mfaEnabled) {
      return reply.code(400).send({ error: 'MFA not enabled' });
    }

    if (!password) {
      return reply.code(400).send({ error: 'Password required' });
    }

    const bcrypt = await import('bcryptjs');
    const passwordValid = await bcrypt.default.compare(password, user.password);

    if (!passwordValid) {
      return reply.code(400).send({ error: 'Invalid password' });
    }

    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await storage.updateUser(user.id, {
      mfaBackupCodes: hashedBackupCodes
    });

    console.log(`[MFA] Backup codes regenerated for user ${user.email}`);

    return {
      success: true,
      backupCodes
    };
  });

  fastify.get('/mfa/status', async (req, reply) => {
    const auth = await requireAuth(req, reply);
    if (!auth) return;

    const { user } = auth;

    if (user.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({ error: 'Only platform owners can access MFA status' });
    }

    return {
      enabled: user.mfaEnabled || false,
      backupCodesRemaining: user.mfaBackupCodes?.length || 0
    };
  });
}
