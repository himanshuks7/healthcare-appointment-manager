import { NextResponse } from 'next/server';
import { runHoldCleanup, runAppointmentReminders, runMedicationReminders, runEmailRetry } from '@/lib/jobs/scheduler';

// This endpoint is called by Vercel Cron or can be called manually
// Vercel Cron config is in vercel.json
export async function GET() {
  try {
    const results = await Promise.allSettled([
      runHoldCleanup(),
      runAppointmentReminders(),
      runMedicationReminders(),
      runEmailRetry(),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        holdCleanup: results[0].status === 'fulfilled' ? results[0].value : 'failed',
        appointmentReminders: results[1].status === 'fulfilled' ? results[1].value : 'failed',
        medicationReminders: results[2].status === 'fulfilled' ? results[2].value : 'failed',
        emailRetry: results[3].status === 'fulfilled' ? results[3].value : 'failed',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
