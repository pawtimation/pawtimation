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

    const byCategory = {
      BUG: feedbackItems.filter(f => f.category === 'BUG'),
      CONFUSION: feedbackItems.filter(f => f.category === 'CONFUSION'),
      IDEA: feedbackItems.filter(f => f.category === 'IDEA'),
      PRAISE: feedbackItems.filter(f => f.category === 'PRAISE'),
      OTHER: feedbackItems.filter(f => f.category === 'OTHER')
    };

    const byDomain = {
      BOOKINGS: feedbackItems.filter(f => f.domain === 'BOOKINGS'),
      STAFF: feedbackItems.filter(f => f.domain === 'STAFF'),
      CLIENTS: feedbackItems.filter(f => f.domain === 'CLIENTS'),
      FINANCE: feedbackItems.filter(f => f.domain === 'FINANCE'),
      ROUTES: feedbackItems.filter(f => f.domain === 'ROUTES'),
      MOBILE_UI: feedbackItems.filter(f => f.domain === 'MOBILE_UI'),
      OTHER: feedbackItems.filter(f => f.domain === 'OTHER'),
      // Legacy domain support (backward compatibility)
      ADMIN: feedbackItems.filter(f => f.domain === 'ADMIN'),
      OWNER: feedbackItems.filter(f => f.domain === 'OWNER'),
      CLIENT: feedbackItems.filter(f => f.domain === 'CLIENT'),
      PUBLIC: feedbackItems.filter(f => f.domain === 'PUBLIC')
    };

    const bySeverity = {
      CRITICAL: feedbackItems.filter(f => f.severity === 'CRITICAL'),
      HIGH: feedbackItems.filter(f => f.severity === 'HIGH'),
      MEDIUM: feedbackItems.filter(f => f.severity === 'MEDIUM'),
      LOW: feedbackItems.filter(f => f.severity === 'LOW')
    };

    // Sort by CRITICAL → HIGH → occurrenceCount as per spec
    const sortedTopIssues = [...feedbackItems].sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.occurrenceCount - a.occurrenceCount;
    });
    const topIssues = sortedTopIssues.slice(0, 10);

    const getSeverityBadge = (severity) => {
      const badges = {
        CRITICAL: '🔴',
        HIGH: '🟠',
        MEDIUM: '🟡',
        LOW: '🟢'
      };
      return badges[severity] || '⚪';
    };

    const getCategoryIcon = (category) => {
      const icons = {
        BUG: '🐛',
        CONFUSION: '❓',
        IDEA: '💡',
        PRAISE: '👍',
        OTHER: '💬'
      };
      return icons[category] || '💬';
    };

    const renderFeedbackList = (items) => {
      if (items.length === 0) return '<p style="color: #666;">None</p>';
      return `
        <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
          ${items.map(item => `
            <div style="background: white; padding: 12px; margin-bottom: 8px; border-left: 3px solid ${item.severity === 'CRITICAL' ? '#dc2626' : item.severity === 'HIGH' ? '#f59e0b' : '#3F9C9B'}; border-radius: 4px;">
              <div style="font-weight: bold; color: #2A2D34; margin-bottom: 4px;">
                ${getCategoryIcon(item.category)} ${item.category} • ${getSeverityBadge(item.severity)} ${item.severity} • #${item.id}
              </div>
              <div style="font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 6px;">${item.title}</div>
              <div style="color: #555; line-height: 1.5; margin-bottom: 8px; white-space: pre-wrap;">${item.description}</div>
              <div style="font-size: 12px; color: #999;">
                ${new Date(item.createdAt).toLocaleString('en-GB', { timeZone: 'Europe/London' })}
                • Domain: ${item.domain}
                ${item.occurrenceCount > 1 ? `• Reported ${item.occurrenceCount}x` : ''}
                ${item.businessId ? `• Business: ${item.businessId}` : ''}
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
                  <div class="stat-number">${bySeverity.CRITICAL.length}</div>
                  <div class="stat-label">🔴 Critical Issues</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${bySeverity.HIGH.length}</div>
                  <div class="stat-label">🟠 High Priority</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${byCategory.BUG.length}</div>
                  <div class="stat-label">🐛 Bug Reports</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">🔥 Top 10 Issues (by Severity + Occurrence)</div>
              ${renderFeedbackList(topIssues)}
            </div>

            <div class="section">
              <div class="section-title">📊 Breakdown by Category</div>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 6px;">
                <div style="margin-bottom: 8px;"><strong>🐛 Bugs:</strong> ${byCategory.BUG.length}</div>
                <div style="margin-bottom: 8px;"><strong>❓ Confusion:</strong> ${byCategory.CONFUSION.length}</div>
                <div style="margin-bottom: 8px;"><strong>💡 Ideas:</strong> ${byCategory.IDEA.length}</div>
                <div style="margin-bottom: 8px;"><strong>👍 Praise:</strong> ${byCategory.PRAISE.length}</div>
                <div><strong>💬 Other:</strong> ${byCategory.OTHER.length}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📍 Breakdown by Domain</div>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 6px;">
                <div style="margin-bottom: 8px;"><strong>Bookings & Jobs:</strong> ${byDomain.BOOKINGS.length}</div>
                <div style="margin-bottom: 8px;"><strong>Staff Management:</strong> ${byDomain.STAFF.length}</div>
                <div style="margin-bottom: 8px;"><strong>Client Management:</strong> ${byDomain.CLIENTS.length}</div>
                <div style="margin-bottom: 8px;"><strong>Finance & Invoices:</strong> ${byDomain.FINANCE.length}</div>
                <div style="margin-bottom: 8px;"><strong>Walking Routes:</strong> ${byDomain.ROUTES.length}</div>
                <div style="margin-bottom: 8px;"><strong>Mobile UI:</strong> ${byDomain.MOBILE_UI.length}</div>
                <div style="margin-bottom: 8px;"><strong>Other:</strong> ${byDomain.OTHER.length}</div>
                ${(byDomain.ADMIN.length + byDomain.OWNER.length + byDomain.CLIENT.length + byDomain.PUBLIC.length) > 0 ? `
                  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 8px;"><em>Legacy domain data:</em></div>
                    ${byDomain.ADMIN.length > 0 ? `<div style="margin-bottom: 4px;"><strong>Admin Portal:</strong> ${byDomain.ADMIN.length}</div>` : ''}
                    ${byDomain.OWNER.length > 0 ? `<div style="margin-bottom: 4px;"><strong>Owner Portal:</strong> ${byDomain.OWNER.length}</div>` : ''}
                    ${byDomain.CLIENT.length > 0 ? `<div style="margin-bottom: 4px;"><strong>Client Portal:</strong> ${byDomain.CLIENT.length}</div>` : ''}
                    ${byDomain.PUBLIC.length > 0 ? `<div><strong>Public/Logged Out:</strong> ${byDomain.PUBLIC.length}</div>` : ''}
                  </div>
                ` : ''}
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
      subject: `🐾 Pawtimation Feedback Summary - ${feedbackItems.length} item${feedbackItems.length !== 1 ? 's' : ''} (${bySeverity.CRITICAL.length} critical) - ${new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}`,
      html: htmlContent
    });

    console.log(`[Feedback Summary] ✓ Daily summary sent to ${TARGET_EMAIL} (${feedbackItems.length} items, ${bySeverity.CRITICAL.length} critical)`);

    return {
      sent: true,
      count: feedbackItems.length,
      critical: bySeverity.CRITICAL.length,
      recipient: TARGET_EMAIL
    };

  } catch (error) {
    console.error('[Feedback Summary] ✗ Failed to send daily summary:', error);
    return { error: error.message };
  }
}
