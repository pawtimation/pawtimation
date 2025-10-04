import { SUPPORT } from './supportConfig.js';

const mem = (globalThis.__PT_MEM__ = globalThis.__PT_MEM__ || {});
const chats = (mem.chats = mem.chats || new Map()); // chatId -> { id, createdAt, owner? , messages:[{role,text,ts,tags:[]}] }
const metrics = (mem.supportMetrics = mem.supportMetrics || {
  totalChats: 0,
  handledByBot: 0,
  escalated: 0,
  csatUp: 0,
  csatDown: 0
});

// --- helpers
function nid(p='chat'){ return `${p}_${Math.random().toString(36).slice(2,10)}`; }
function now(){ return Date.now(); }

function scoreNeedsEscalation(userText, chat){
  const t = (userText||'').toLowerCase();
  // keyword trigger
  for (const k of SUPPORT.KEYWORDS) if (t.includes(k)) return {ok:true, reason:`keyword:${k}`};
  // too many turns without resolution
  const turns = chat.messages.filter(m=>m.role==='assistant' || m.role==='user').length;
  const resolved = chat.messages.some(m=>m.tags?.includes('resolved'));
  if (!resolved && turns >= SUPPORT.MAX_TURNS_WITHOUT_RESOLUTION)
    return {ok:true, reason:'too_many_turns'};
  return {ok:false};
}

async function sendEscalationEmail({ chat, reason }){
  const subject = `Pawtimation: Support escalation (${reason}) — ${chat.id}`;
  const plain = [
    `Reason: ${reason}`,
    `Chat: ${chat.id}`,
    `Created: ${new Date(chat.createdAt).toISOString()}`,
    ``,
    `Transcript:`,
    ...chat.messages.map(m=>`[${m.role}] ${m.text}`)
  ].join('\n');

  // Option A: SendGrid (if key provided)
  if (SUPPORT.SENDGRID_API_KEY) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method:'POST',
        headers:{
          'Authorization':`Bearer ${SUPPORT.SENDGRID_API_KEY}`,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          personalizations:[{ to:[{email: SUPPORT.ALERT_EMAIL}] }],
          from:{ email: SUPPORT.SEND_FROM, name:'Pawtimation Support Bot' },
          subject,
          content:[{ type:'text/plain', value: plain }]
        })
      });
      return { ok: res.ok };
    } catch(e){ return { ok:false, error: String(e) }; }
  }

  // Option B: generic webhook (Zapier/Make → email)
  if (SUPPORT.EMAIL_WEBHOOK_URL){
    try {
      const res = await fetch(SUPPORT.EMAIL_WEBHOOK_URL, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ to: SUPPORT.ALERT_EMAIL, subject, text: plain, chatId: chat.id })
      });
      return { ok: res.ok };
    } catch(e){ return { ok:false, error: String(e) }; }
  }

  // Fallback: no sender configured → log only
  console.log('[ESCALATION EMAIL - SIMULATED]\n', plain);
  return { ok:true, simulated:true };
}

// Very simple "AI" bot (rule-based for now)
function botReply(userText){
  const t = (userText||'').toLowerCase();

  // quick intents
  if (t.includes('book') || t.includes('availability'))
    return { text: 'I can help with booking. Please share dates, your postcode, and service type (walk, home visit, or day care).', tags:['booking_help'] };
  if (t.includes('price') || t.includes('cost') || t.includes('fees'))
    return { text: 'Typical rates: Walk £25, Home visit £25/day, Day care £45. Companions may vary by location and experience.', tags:['pricing'] };
  if (t.includes('refund') || t.includes('cancel'))
    return { text: 'Our standard policy: full refund if you cancel before 12:00pm, 7 days prior. Do you want me to start a cancellation?', tags:['policy'] };
  if (t.includes('safety') || t.includes('insurance'))
    return { text: 'All Pros show their public insurance certificate on their profile. Trainees are supervised and can accept only low-risk jobs.', tags:['safety'] };
  if (t.includes('community') || t.includes('event'))
    return { text: 'Community Day runs monthly in Beaconsfield (HP9). RSVP opens 3 weeks before; it confirms at 5+ attendees.', tags:['community'] };
  if (t.includes('human') || t.includes('agent') || t.includes('support'))
    return { text: 'Happy to help. If this needs a human, I will escalate right away. Could you describe the issue in a sentence?', tags:['handoff'] };

  // default
  return { text: 'I can help with bookings, pricing, safety, or community events. Tell me what you need in a sentence.', tags:['generic'] };
}

export default async function supportRoutes(app){

  // Create a chat session
  app.post('/support/chat', async (req)=>{
    const id = nid();
    const user = req.body?.user || { id:'guest', name:'Guest', role:'owner' };
    const chat = { id, createdAt: now(), user, messages: [], escalated: false, handledByBot: false };
    chats.set(id, chat);
    metrics.totalChats++;
    return { ok:true, chatId: id };
  });

  // Post a user message → bot reply → maybe escalate
  app.post('/support/chat/:id/message', async (req)=>{
    const chat = chats.get(req.params.id);
    if (!chat) return { error:'not_found' };
    const userText = (req.body?.text || '').trim();
    chat.messages.push({ role:'user', text:userText, ts: now(), tags:[] });

    // Escalation check (pre)
    const pre = scoreNeedsEscalation(userText, chat);
    if (pre.ok) {
      chat.messages.push({ role:'system', text:`Escalating to human support (${pre.reason}).`, ts:now(), tags:['escalated'] });
      if (!chat.escalated) { // First escalation for this chat
        chat.escalated = true;
        metrics.escalated++;
        // If this chat was previously counted as handled, remove that count
        if (chat.handledByBot) {
          metrics.handledByBot--;
          chat.handledByBot = false;
        }
      }
      await sendEscalationEmail({ chat, reason: pre.reason });
      return { ok:true, escalated:true, messages: chat.messages.slice(-5) };
    }

    // Bot reply
    const reply = botReply(userText);
    chat.messages.push({ role:'assistant', text: reply.text, ts: now(), tags: reply.tags });

    // Escalation check (post; e.g., too many turns)
    const post = scoreNeedsEscalation(userText, chat);
    if (post.ok) {
      chat.messages.push({ role:'system', text:`Escalating to human support (${post.reason}).`, ts:now(), tags:['escalated'] });
      if (!chat.escalated) { // First escalation for this chat
        chat.escalated = true;
        metrics.escalated++;
        // If this chat was previously counted as handled, remove that count
        if (chat.handledByBot) {
          metrics.handledByBot--;
          chat.handledByBot = false;
        }
      }
      await sendEscalationEmail({ chat, reason: post.reason });
      return { ok:true, escalated:true, messages: chat.messages.slice(-6) };
    }

    // If user asked policy/booking etc, we count as handled (only once per chat and only if not escalated)
    if (!chat.handledByBot && !chat.escalated && (reply.tags.includes('booking_help') || reply.tags.includes('policy') || reply.tags.includes('pricing'))) {
      chat.handledByBot = true;
      metrics.handledByBot++;
    }

    return { ok:true, messages: chat.messages.slice(-5) };
  });

  // CSAT (paw up/down)
  app.post('/support/chat/:id/csat', async (req)=>{
    const chat = chats.get(req.params.id);
    if (!chat) return { error:'not_found' };
    const { vote } = req.body || {};
    if (vote === 'up') metrics.csatUp++;
    if (vote === 'down') {
      metrics.csatDown++;
      if (SUPPORT.ESCALATE_ON_NEGATIVE_CSAT && !chat.escalated){
        chat.messages.push({ role:'system', text:'Escalated due to negative feedback.', ts:now(), tags:['escalated'] });
        chat.escalated = true;
        metrics.escalated++;
        // If this chat was previously counted as handled, remove that count
        if (chat.handledByBot) {
          metrics.handledByBot--;
          chat.handledByBot = false;
        }
        await sendEscalationEmail({ chat, reason:'negative_csat' });
      }
    }
    return { ok:true, metrics };
  });

  // Metrics for admin
  app.get('/support/metrics', async ()=> metrics);
}
