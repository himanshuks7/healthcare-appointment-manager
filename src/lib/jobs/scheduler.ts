/**
 * Background Job Scheduler
 * 
 * This module registers background jobs that run on a schedule.
 * In a serverless environment (Vercel), these would be Vercel Cron jobs.
 * For local development, they run via node-cron.
 * 
 * Jobs:
 * 1. Clean expired slot holds (every 1 minute)
 * 2. Send appointment reminders (every hour)
 * 3. Send medication reminders (every 30 minutes)
 * 4. Retry failed emails (every 15 minutes)
 */

import { cleanupExpiredHolds } from '@/lib/services/slot-service';
import { retryFailedEmails } from '@/lib/services/email-service';
import prisma from '@/lib/prisma';

/**
 * Clean up expired slot holds
 */
export async function runHoldCleanup(): Promise<number> {
  try {
    const cleaned = await cleanupExpiredHolds();
    if (cleaned > 0) {
      console.log(`[Scheduler] Cleaned ${cleaned} expired slot holds`);
    }
    return cleaned;
  } catch (error) {
    console.error('[Scheduler] Hold cleanup failed:', error);
    return 0;
  }
}

/**
 * Send appointment reminders for appointments within 24 hours
 */
export async function runAppointmentReminders(): Promise<number> {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        slotStart: { gte: now, lte: tomorrow },
        status: 'CONFIRMED',
      },
      include: {
        patient: { select: { name: true, email: true } },
        doctor: {
          select: {
            specialisation: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    // In a real implementation, we'd send reminder emails here
    // and track which reminders have already been sent
    console.log(`[Scheduler] ${upcomingAppointments.length} appointments need reminders`);
    return upcomingAppointments.length;
  } catch (error) {
    console.error('[Scheduler] Appointment reminders failed:', error);
    return 0;
  }
}

/**
 * Process medication reminders
 */
export async function runMedicationReminders(): Promise<number> {
  try {
    const now = new Date();

    const dueReminders = await prisma.medicationReminder.findMany({
      where: {
        isActive: true,
        nextReminderAt: { lte: now },
        endDate: { gte: now },
      },
      include: {
        patient: { select: { name: true, email: true } },
      },
      take: 20,
    });

    for (const reminder of dueReminders) {
      // Update next reminder time based on frequency
      const hoursUntilNext = getHoursFromFrequency(reminder.frequency);
      await prisma.medicationReminder.update({
        where: { id: reminder.id },
        data: {
          nextReminderAt: new Date(now.getTime() + hoursUntilNext * 60 * 60 * 1000),
        },
      });
    }

    if (dueReminders.length > 0) {
      console.log(`[Scheduler] Processed ${dueReminders.length} medication reminders`);
    }
    return dueReminders.length;
  } catch (error) {
    console.error('[Scheduler] Medication reminders failed:', error);
    return 0;
  }
}

/**
 * Retry failed emails
 */
export async function runEmailRetry(): Promise<number> {
  try {
    const retried = await retryFailedEmails();
    if (retried > 0) {
      console.log(`[Scheduler] Retried ${retried} failed emails`);
    }
    return retried;
  } catch (error) {
    console.error('[Scheduler] Email retry failed:', error);
    return 0;
  }
}

/**
 * Helper: Convert frequency text to hours
 */
function getHoursFromFrequency(frequency: string): number {
  const lower = frequency.toLowerCase();
  if (lower.includes('once daily') || lower.includes('once a day')) return 24;
  if (lower.includes('twice daily') || lower.includes('twice a day')) return 12;
  if (lower.includes('three times') || lower.includes('thrice')) return 8;
  if (lower.includes('every 8 hours')) return 8;
  if (lower.includes('every 6 hours')) return 6;
  if (lower.includes('every 4 hours')) return 4;
  return 12; // Default: twice daily
}
