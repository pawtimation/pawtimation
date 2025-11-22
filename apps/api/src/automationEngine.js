import { repo, isInvoiceOverdue } from './repo.js';
import { sendEmail, sendPaymentReminder, sendPaymentFinalNotice } from './emailService.js';
import { storage } from './storage.js';

/**
 * Automation engine for Pawtimation
 * This function will run periodically (via cron or interval timer)
 * to execute automated tasks like reminders, summaries, and alerts.
 */
export async function runAutomations() {
  // Check if it's 9am UK time for daily reminders
  const now = new Date();
  const ukTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const currentHour = ukTime.getHours();
  
  const businesses = await repo.listBusinesses();

  for (const biz of businesses) {
    const automation = biz.settings?.automation;

    if (!automation) continue;

    // Grace period enforcement runs every hour
    await handleGracePeriodEnforcement(biz);

    await handleBookingReminders(biz);
    
    // Invoice reminders only run at 9am UK time
    if (currentHour === 9) {
      await handleInvoiceReminders(biz);
    }
    
    await handleDailySummary(biz);
    await handleAutoComplete(biz);
    await handleConflictAlerts(biz);
    await handleWeeklySnapshot(biz);
  }
}

// --- Automation handlers (pending future development) ---
// NOTE: These features are placeholders for post-MVP automation capabilities.
// Current automation in production:
// - apps/api/src/agents/betaAutomation.js: Beta tester email workflow
// - apps/api/src/agents/feedbackSummary.js: Daily feedback digest
// Future development needed for client-facing automations below:

async function handleBookingReminders(biz) {
  if (!biz.settings.automation.bookingReminderEnabled) return;
  
  // FUTURE: Look up upcoming bookings within the reminder window
  // Send reminder emails to clients via email service
  console.log(`[Automation] Booking reminders disabled (pending development) for ${biz.name}`);
}

async function handleInvoiceReminders(biz) {
  if (!biz.settings.automation.invoiceReminderEnabled) return;
  
  const daysOverdue = biz.settings.automation.invoiceReminderDaysOverdue || 3;
  const maxReminders = biz.settings.automation.invoiceReminderMaxCount || 3;
  
  // Get all invoices for this business
  const invoices = await repo.listInvoicesByBusiness(biz.id);
  
  // Filter for invoices that need reminders
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const invoicesNeedingReminders = invoices.filter(inv => {
    // Must be overdue
    if (!isInvoiceOverdue(inv)) return false;
    
    // Must not have exceeded max reminder count
    const reminderCount = inv.reminderCount || 0;
    if (reminderCount >= maxReminders) return false;
    
    // Must be overdue by at least the configured days
    const dueDate = new Date(inv.dueDate);
    const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
    if (daysSinceDue < daysOverdue) return false;
    
    // Do NOT send reminders for invoices older than 90 days
    if (dueDate < ninetyDaysAgo) return false;
    
    // Must not have been reminded in the last 48 hours
    if (inv.lastReminderAt) {
      const lastReminder = new Date(inv.lastReminderAt);
      if (lastReminder > twoDaysAgo) return false;
    }
    
    return true;
  });
  
  if (invoicesNeedingReminders.length === 0) {
    console.log(`[Automation] No invoice reminders needed for ${biz.name}`);
    return;
  }
  
  console.log(`[Automation] Sending ${invoicesNeedingReminders.length} invoice reminders for ${biz.name}`);
  
  // Send reminders and update tracking
  for (const invoice of invoicesNeedingReminders) {
    try {
      // Get client details
      const client = await repo.getClient(invoice.clientId);
      if (!client || !client.email) {
        console.log(`[Automation] Skipping invoice ${invoice.id} - client has no email`);
        continue;
      }
      
      // Calculate days overdue
      const dueDate = new Date(invoice.dueDate);
      const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      
      // Format amount
      const amountFormatted = (invoice.amountCents / 100).toFixed(2);
      
      // Send reminder email
      const emailResult = await sendEmail({
        to: client.email,
        subject: `Payment Reminder: Invoice ${invoice.id.replace('inv_', '').toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0FAE7B;">Payment Reminder</h2>
            <p>Dear ${client.name},</p>
            <p>This is a friendly reminder that the following invoice is now overdue:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.id.replace('inv_', '').toUpperCase()}</p>
              <p style="margin: 5px 0;"><strong>Amount Due:</strong> £${amountFormatted}</p>
              <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Days Overdue:</strong> ${daysSinceDue}</p>
            </div>
            <p>Please arrange payment at your earliest convenience. If you have any questions or need to discuss payment arrangements, please don't hesitate to contact us.</p>
            <p>Thank you for your prompt attention to this matter.</p>
            <p style="margin-top: 30px;">Best regards,<br/>${biz.name}</p>
          </div>
        `,
        text: `Payment Reminder\n\nDear ${client.name},\n\nThis is a friendly reminder that invoice ${invoice.id.replace('inv_', '').toUpperCase()} for £${amountFormatted} was due on ${new Date(invoice.dueDate).toLocaleDateString()} and is now ${daysSinceDue} days overdue.\n\nPlease arrange payment at your earliest convenience.\n\nBest regards,\n${biz.name}`
      });
      
      if (emailResult.success) {
        // Update invoice reminder tracking
        await storage.updateInvoice(invoice.id, {
          lastReminderAt: now.toISOString(),
          reminderCount: (invoice.reminderCount || 0) + 1
        });
        
        console.log(`[Automation] Sent invoice reminder to ${client.email} for invoice ${invoice.id}`);
      } else {
        console.error(`[Automation] Failed to send reminder for invoice ${invoice.id}:`, emailResult.error);
      }
      
    } catch (error) {
      console.error(`[Automation] Error processing invoice ${invoice.id}:`, error);
    }
  }
}

async function handleGracePeriodEnforcement(biz) {
  // Skip if no grace period active
  if (!biz.gracePeriodEnd) return;

  const now = new Date();
  const gracePeriodEnd = new Date(biz.gracePeriodEnd);
  const timeRemaining = gracePeriodEnd - now;
  const hoursRemaining = timeRemaining / (1000 * 60 * 60);
  const daysRemaining = Math.ceil(hoursRemaining / 24);

  // Get business owner for email notifications
  const owner = await repo.getUserById(biz.ownerUserId);
  if (!owner?.email) {
    console.warn(`[Automation] No owner email found for business ${biz.id} in grace period`);
    return;
  }

  // Case 1: Grace period expired - suspend business
  if (timeRemaining <= 0) {
    console.log(`[Automation] Grace period expired for business ${biz.id} - suspending`);
    
    await repo.updateBusiness(biz.id, {
      planStatus: 'SUSPENDED',
      suspensionReason: 'Payment failed - grace period expired',
      gracePeriodEnd: null,
      updatedAt: now
    });

    await repo.createSystemLog({
      logType: 'PAYMENT',
      severity: 'ERROR',
      message: 'Business suspended - Grace period expired without payment',
      metadata: {
        businessId: biz.id,
        gracePeriodEnd: biz.gracePeriodEnd,
        failureCount: biz.paymentFailureCount || 0
      }
    });

    console.log(`[Automation] Business ${biz.id} suspended due to expired grace period`);
    return;
  }

  // Case 2: Final notice (within 6 hours of expiry)
  if (hoursRemaining <= 6 && hoursRemaining > 0) {
    // Check if we already sent final notice (to avoid spam)
    const recentLogs = await storage.getSystemLogsRecent(10);
    const alreadySentFinal = recentLogs.some(log => 
      log.message?.includes('Final payment notice sent') &&
      log.metadata?.businessId === biz.id &&
      new Date(log.createdAt) > new Date(now.getTime() - 6 * 60 * 60 * 1000) // Within last 6 hours
    );

    if (!alreadySentFinal) {
      console.log(`[Automation] Sending final payment notice to ${owner.email} for business ${biz.id}`);
      
      await sendPaymentFinalNotice({
        to: owner.email,
        businessName: biz.name,
        gracePeriodEnd
      });

      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'WARN',
        message: 'Final payment notice sent',
        metadata: {
          businessId: biz.id,
          email: owner.email,
          hoursRemaining: Math.round(hoursRemaining * 10) / 10,
          gracePeriodEnd: gracePeriodEnd.toISOString()
        }
      });
    }
  }

  // Case 3: 24-hour reminder (between 18-30 hours remaining)
  if (hoursRemaining >= 18 && hoursRemaining <= 30) {
    // Check if we already sent 24h reminder
    const recentLogs = await storage.getSystemLogsRecent(10);
    const alreadySent24h = recentLogs.some(log => 
      log.message?.includes('24-hour payment reminder sent') &&
      log.metadata?.businessId === biz.id &&
      new Date(log.createdAt) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );

    if (!alreadySent24h) {
      console.log(`[Automation] Sending 24-hour payment reminder to ${owner.email} for business ${biz.id}`);
      
      await sendPaymentReminder({
        to: owner.email,
        businessName: biz.name,
        gracePeriodEnd,
        daysRemaining
      });

      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'WARN',
        message: '24-hour payment reminder sent',
        metadata: {
          businessId: biz.id,
          email: owner.email,
          daysRemaining,
          gracePeriodEnd: gracePeriodEnd.toISOString()
        }
      });
    }
  }
}

async function handleDailySummary(biz) {
  if (!biz.settings.automation.dailySummaryEnabled) return;
  
  // FUTURE: Generate daily summary report
  // Send email to business owner via email service
  console.log(`[Automation] Daily summary disabled (pending development) for ${biz.name}`);
}

async function handleAutoComplete(biz) {
  if (!biz.settings.automation.autoCompleteEnabled) return;
  
  // FUTURE: Find jobs past their end time + buffer hours
  // Auto-mark as completed and notify relevant parties
  console.log(`[Automation] Auto-complete disabled (pending development) for ${biz.name}`);
}

async function handleConflictAlerts(biz) {
  if (!biz.settings.automation.conflictAlertsEnabled) return;
  
  // FUTURE: Detect scheduling conflicts
  // Send alerts to admin via email service
  console.log(`[Automation] Conflict alerts disabled (pending development) for ${biz.name}`);
}

async function handleWeeklySnapshot(biz) {
  if (!biz.settings.automation.weeklySnapshotEnabled) return;
  
  // FUTURE: Generate weekly revenue snapshot
  // Send email on specified day via email service
  console.log(`[Automation] Weekly snapshot disabled (pending development) for ${biz.name}`);
}
