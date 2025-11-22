import { storage } from '../storage.js';
import { sendEmail } from '../emailService.js';

const TARGET_HOUR_UK = 21;
const TARGET_EMAIL = 'hello@pawtimation.co.uk';

export async function sendDailyFeedbackSummary() {
  try {
    const now = new Date();
    const ukTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const currentHour = ukTime.getHours();

    if (currentHour !== TARGET_HOUR_UK) {
      return { skipped: true, reason: `Not 21:00 UK time (current: ${currentHour}:00)` };
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const feedbackItems = await storage.getFeedbackByDateRange(yesterday, now);

    if (feedbackItems.length === 0) {
      console.log('[Feedback Summary] No feedback in last 24h - skipping email');
      return { skipped: true, reason: 'No feedback in last 24 hours' };
    }

    const byType = {
      BUG: feedbackItems.filter(f => f.feedbackType === 'BUG'),
      IDEA: feedbackItems.filter(f => f.feedbackType === 'IDEA'),
      PRAISE: feedbackItems.filter(f => f.feedbackType === 'PRAISE'),
      OTHER: feedbackItems.filter(f => f.feedbackType === 'OTHER')
    };

    const byDomain = {
      ADMIN: feedbackItems.filter(f => f.domain === 'ADMIN'),
      STAFF: feedbackItems.filter(f => f.domain === 'STAFF'),
      CLIENT: feedbackItems.filter(f => f.domain === 'CLIENT'),
      OWNER: feedbackItems.filter(f => f.domain === 'OWNER'),
      PUBLIC: feedbackItems.filter(f => f.domain === 'PUBLIC')
    };

    const renderFeedbackList = (items) => {
      if (items.length === 0) return '<p style="color: #666;">None</p>';
      return `
        <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
          ${items.map(item => `
            <div style="background: white; padding: 12px; margin-bottom: 8px; border-left: 3px solid #3F9C9B; border-radius: 4px;">
              <div style="font-weight: bold; color: #2A2D34; margin-bottom: 4px;">
                ${item.feedbackType === 'BUG' ? '🐛' : item.feedbackType === 'IDEA' ? '💡' : item.feedbackType === 'PRAISE' ? '👍' : '💬'} 
                ${item.feedbackType} from ${item.domain} • #${item.id}
              </div>
              <div style="color: #555; line-height: 1.5; margin-bottom: 8px; white-space: pre-wrap;">${item.message}</div>
              <div style="font-size: 12px; color: #999;">
                ${new Date(item.createdAt).toLocaleString('en-GB', { timeZone: 'Europe/London' })}
                ${item.businessId ? `• Business: ${item.businessId}` : ''}
                ${item.userId ? `• User: ${item.userId}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .header { background: linear-gradient(135deg, #3F9C9B, #66B2B2); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 24px; background: white; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; color: #2A2D34; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #3F9C9B; }
          .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-card { background: #f8f9fa; padding: 16px; border-radius: 6px; text-align: center; }
          .stat-number { font-size: 32px; font-weight: bold; color: #3F9C9B; }
          .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: #f5f5f5;">
        <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px;">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">📊 Daily Feedback Summary</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">
              ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' })}
            </p>
          </div>

          <div class="content">
            <div class="section">
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-number">${feedbackItems.length}</div>
                  <div class="stat-label">Total Feedback Items</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${byType.BUG.length}</div>
                  <div class="stat-label">🐛 Bug Reports</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${byType.IDEA.length}</div>
                  <div class="stat-label">💡 Ideas</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${byType.PRAISE.length}</div>
                  <div class="stat-label">👍 Praise</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">🐛 Bug Reports (${byType.BUG.length})</div>
              ${renderFeedbackList(byType.BUG)}
            </div>

            <div class="section">
              <div class="section-title">💡 Ideas (${byType.IDEA.length})</div>
              ${renderFeedbackList(byType.IDEA)}
            </div>

            <div class="section">
              <div class="section-title">👍 Praise (${byType.PRAISE.length})</div>
              ${renderFeedbackList(byType.PRAISE)}
            </div>

            ${byType.OTHER.length > 0 ? `
              <div class="section">
                <div class="section-title">💬 Other (${byType.OTHER.length})</div>
                ${renderFeedbackList(byType.OTHER)}
              </div>
            ` : ''}

            <div class="section">
              <div class="section-title">📍 Breakdown by Source</div>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 6px;">
                <div style="margin-bottom: 8px;"><strong>Admin Portal:</strong> ${byDomain.ADMIN.length}</div>
                <div style="margin-bottom: 8px;"><strong>Staff Portal:</strong> ${byDomain.STAFF.length}</div>
                <div style="margin-bottom: 8px;"><strong>Client Portal:</strong> ${byDomain.CLIENT.length}</div>
                <div style="margin-bottom: 8px;"><strong>Owner Portal:</strong> ${byDomain.OWNER.length}</div>
                <div><strong>Public/Logged Out:</strong> ${byDomain.PUBLIC.length}</div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                View and manage all feedback in the 
                <a href="${process.env.VITE_WEB_URL || 'https://pawtimation.co.uk'}/owner/feedback" style="color: #3F9C9B; text-decoration: none; font-weight: bold;">Owner Portal</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: TARGET_EMAIL,
      subject: `🐾 Pawtimation Feedback Summary - ${feedbackItems.length} item${feedbackItems.length !== 1 ? 's' : ''} (${new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })})`,
      html: htmlContent
    });

    console.log(`[Feedback Summary] ✓ Daily summary sent to ${TARGET_EMAIL} (${feedbackItems.length} items)`);

    return {
      sent: true,
      count: feedbackItems.length,
      recipient: TARGET_EMAIL
    };

  } catch (error) {
    console.error('[Feedback Summary] ✗ Failed to send daily summary:', error);
    return { error: error.message };
  }
}
