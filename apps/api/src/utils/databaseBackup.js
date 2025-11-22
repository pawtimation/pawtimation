import { Client } from '@replit/object-storage';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_PREFIX = 'db-backups/';
const MAX_BACKUPS_TO_KEEP = 12;
const MAX_TIMEOUT_MS = 2147483647;

let objectStorage = null;
function getObjectStorage() {
  if (!objectStorage) {
    objectStorage = new Client();
  }
  return objectStorage;
}

export class DatabaseBackup {
  constructor() {
    this.scheduleInterval = null;
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `pawtimation-backup-${timestamp}.sql`;
    const tempFilePath = path.join('/tmp', backupFileName);

    try {
      console.log(`[BACKUP] Starting database backup at ${new Date().toISOString()}`);

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not found in environment');
      }

      console.log('[BACKUP] Exporting database using pg_dump...');
      
      await new Promise((resolve, reject) => {
        const outputStream = fs.createWriteStream(tempFilePath);
        const pgDump = spawn('pg_dump', [databaseUrl], {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        pgDump.stdout.pipe(outputStream);

        let errorOutput = '';
        pgDump.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pgDump.on('error', (err) => {
          outputStream.destroy();
          reject(new Error(`pg_dump process error: ${err.message}`));
        });

        pgDump.on('close', (code) => {
          outputStream.end();
          if (code !== 0) {
            reject(new Error(`pg_dump exited with code ${code}: ${errorOutput}`));
          } else {
            resolve();
          }
        });
      });

      const backupData = fs.readFileSync(tempFilePath);
      const fileSize = (backupData.length / 1024 / 1024).toFixed(2);
      console.log(`[BACKUP] Database exported successfully (${fileSize} MB)`);

      console.log('[BACKUP] Uploading to Object Storage...');
      const storageKey = `${BACKUP_PREFIX}${backupFileName}`;
      const storage = getObjectStorage();
      await storage.uploadFromBytes(storageKey, backupData, {
        contentType: 'application/sql',
        metadata: {
          createdAt: new Date().toISOString(),
          size: backupData.length.toString(),
          type: 'database-backup'
        }
      });

      fs.unlinkSync(tempFilePath);

      console.log(`[BACKUP] ✅ Backup completed successfully: ${storageKey} (${fileSize} MB)`);

      await this.cleanupOldBackups();

      return {
        success: true,
        fileName: backupFileName,
        size: fileSize,
        timestamp
      };
    } catch (error) {
      console.error('[BACKUP] ❌ Backup failed:', error.message);
      
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const storage = getObjectStorage();
      const { objects } = await storage.list(BACKUP_PREFIX);
      
      if (!objects || objects.length <= MAX_BACKUPS_TO_KEEP) {
        return;
      }

      const sortedBackups = objects
        .filter(obj => obj.key.startsWith(BACKUP_PREFIX))
        .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

      const backupsToDelete = sortedBackups.slice(MAX_BACKUPS_TO_KEEP);

      for (const backup of backupsToDelete) {
        await storage.delete(backup.key);
        console.log(`[BACKUP] Deleted old backup: ${backup.key}`);
      }

      console.log(`[BACKUP] Cleanup complete. Keeping ${MAX_BACKUPS_TO_KEEP} most recent backups.`);
    } catch (error) {
      console.error('[BACKUP] Cleanup failed:', error.message);
    }
  }

  async listBackups() {
    try {
      const storage = getObjectStorage();
      const { objects } = await storage.list(BACKUP_PREFIX);
      
      if (!objects || objects.length === 0) {
        return [];
      }

      return objects
        .filter(obj => obj.key.startsWith(BACKUP_PREFIX))
        .map(obj => ({
          key: obj.key,
          fileName: obj.key.replace(BACKUP_PREFIX, ''),
          uploaded: obj.uploaded,
          size: obj.size
        }))
        .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
    } catch (error) {
      console.error('[BACKUP] Failed to list backups:', error.message);
      return [];
    }
  }

  getNextBackupTime(isWeekly = false) {
    const now = new Date();
    const next = new Date();

    if (isWeekly) {
      next.setDate(now.getDate() + 7);
    } else {
      next.setMonth(now.getMonth() + 1);
    }

    next.setHours(2, 0, 0, 0);

    return next;
  }

  scheduleBackups() {
    const runBackup = async () => {
      try {
        const now = new Date();
        const isAfterJan1 = now >= new Date('2026-01-01');
        const isWeekly = isAfterJan1;

        await this.createBackup();

        const nextBackupTime = this.getNextBackupTime(isWeekly);
        const msUntilNext = nextBackupTime - now;

        console.log(`[BACKUP] Next ${isWeekly ? 'weekly' : 'monthly'} backup scheduled for: ${nextBackupTime.toISOString()}`);

        if (this.scheduleInterval) {
          clearTimeout(this.scheduleInterval);
        }

        const safeTimeout = Math.min(msUntilNext, MAX_TIMEOUT_MS);
        this.scheduleInterval = setTimeout(msUntilNext > MAX_TIMEOUT_MS ? checkAndSchedule : runBackup, safeTimeout);
      } catch (error) {
        console.error('[BACKUP] Scheduled backup failed:', error.message);
        
        const retryIn = 1000 * 60 * 60;
        console.log(`[BACKUP] Retrying in 1 hour...`);
        this.scheduleInterval = setTimeout(runBackup, retryIn);
      }
    };

    const checkAndSchedule = () => {
      const now = new Date();
      const isAfterJan1 = now >= new Date('2026-01-01');
      const isWeekly = isAfterJan1;
      const nextBackupTime = this.getNextBackupTime(isWeekly);
      const msUntilNext = nextBackupTime - now;

      if (msUntilNext <= 0) {
        runBackup();
      } else {
        const safeTimeout = Math.min(msUntilNext, MAX_TIMEOUT_MS);
        this.scheduleInterval = setTimeout(msUntilNext > MAX_TIMEOUT_MS ? checkAndSchedule : runBackup, safeTimeout);
      }
    };

    const now = new Date();
    const isAfterJan1 = now >= new Date('2026-01-01');
    const isWeekly = isAfterJan1;
    const nextBackupTime = this.getNextBackupTime(isWeekly);
    const msUntilNext = nextBackupTime - now;

    console.log(`[BACKUP] Automated backups scheduled (${isWeekly ? 'WEEKLY' : 'MONTHLY'} mode)`);
    console.log(`[BACKUP] First backup scheduled for: ${nextBackupTime.toISOString()}`);
    console.log(`[BACKUP] Will switch to WEEKLY backups on January 1, 2026`);

    const safeTimeout = Math.min(msUntilNext, MAX_TIMEOUT_MS);
    this.scheduleInterval = setTimeout(msUntilNext > MAX_TIMEOUT_MS ? checkAndSchedule : runBackup, safeTimeout);
  }

  stopSchedule() {
    if (this.scheduleInterval) {
      clearTimeout(this.scheduleInterval);
      this.scheduleInterval = null;
      console.log('[BACKUP] Backup schedule stopped');
    }
  }
}

export const backupService = new DatabaseBackup();
