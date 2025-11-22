import { runDailyDigest } from './digest.js';
import { getAgentFlags } from './controller.js';
import { checkPendingRewards } from './rewardNotifier.js';
import { sendPendingFounderEmails } from './founderEmail.js';

let timers = [];

export function startAgents() {
  stopAgents();
  
  const { digest } = getAgentFlags();
  
  if (digest) {
    const every = Number(process.env.DIGEST_INTERVAL_MS || 60000);
    timers.push(setInterval(() => runDailyDigest().catch(console.error), every));
  }
  
  // Reward notifier (runs every hour)
  timers.push(setInterval(() => checkPendingRewards().catch(console.error), 60 * 60 * 1000));
  checkPendingRewards();
  
  // Founder email agent (runs every hour)
  timers.push(setInterval(() => sendPendingFounderEmails().catch(console.error), 60 * 60 * 1000));
  sendPendingFounderEmails();
  
  console.log('[agents] running', getAgentFlags(), '+ reward notifier (1h) + founder email (1h)');
}

export function stopAgents() {
  timers.forEach(clearInterval);
  timers = [];
}
