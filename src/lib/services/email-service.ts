import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email and logs it to the database.
 * Supports retry on failure. Returns preview URL for Ethereal.
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; previewUrl?: string }> {
  const { to, subject, html } = options;

  // Log the email attempt
  const emailLog = await prisma.emailLog.create({
    data: {
      to,
      subject,
      body: html,
      status: 'PENDING',
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@healthcareapp.com',
      to,
      subject,
      html,
    });

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    // Get Ethereal preview URL if available
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Email preview URL: ${previewUrl}`);
    }

    return { success: true, previewUrl: previewUrl || undefined };
  } catch (error: any) {
    console.error(`Email send failed to ${to}:`, error.message);

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        error: error.message,
        retryCount: 1,
      },
    });

    return { success: false };
  }
}

/**
 * Retries failed emails (called by background job)
 */
export async function retryFailedEmails(): Promise<number> {
  const failedEmails = await prisma.emailLog.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: 3 },
    },
    take: 10,
  });

  let retried = 0;

  for (const email of failedEmails) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@healthcareapp.com',
        to: email.to,
        subject: email.subject,
        html: email.body,
      });

      await prisma.emailLog.update({
        where: { id: email.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      retried++;
    } catch (error: any) {
      await prisma.emailLog.update({
        where: { id: email.id },
        data: {
          retryCount: { increment: 1 },
          error: error.message,
        },
      });
    }
  }

  return retried;
}

// ─── Email Templates ─────────────────────────────────────────────────────────

const baseStyle = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const headerStyle = `
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  color: white;
  padding: 24px 32px;
  text-align: center;
`;

const bodyStyle = `
  padding: 32px;
  color: #1f2937;
  line-height: 1.6;
`;

export function bookingConfirmationEmail(data: {
  patientName: string;
  doctorName: string;
  specialisation: string;
  date: string;
  time: string;
  appointmentId: string;
}): EmailOptions {
  return {
    to: '',
    subject: `✅ Appointment Confirmed - ${data.date}`,
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">🏥 HealthCare+</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Appointment Confirmation</p>
        </div>
        <div style="${bodyStyle}">
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Doctor:</strong> ${data.doctorName}</p>
            <p style="margin: 4px 0;"><strong>Specialisation:</strong> ${data.specialisation}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${data.date}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${data.time}</p>
            <p style="margin: 4px 0;"><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          </div>
          <p>Please arrive 10 minutes before your appointment time.</p>
          <p style="color: #6b7280; font-size: 14px;">If you need to cancel or reschedule, please log in to your patient portal.</p>
        </div>
      </div>
    `,
  };
}

// Alias for confirmationEmail
export const confirmationEmail = bookingConfirmationEmail;

export function appointmentReminderEmail(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}): EmailOptions {
  return {
    to: '',
    subject: `⏰ Appointment Reminder - Tomorrow at ${data.time}`,
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">🏥 HealthCare+</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Appointment Reminder</p>
        </div>
        <div style="${bodyStyle}">
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>This is a reminder that you have an appointment tomorrow:</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Doctor:</strong> ${data.doctorName}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${data.date}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${data.time}</p>
          </div>
          <p>Please arrive 10 minutes early and bring any relevant medical records.</p>
        </div>
      </div>
    `,
  };
}

export function cancellationEmail(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason?: string;
}): EmailOptions {
  return {
    to: '',
    subject: `❌ Appointment Cancelled - ${data.date}`,
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">🏥 HealthCare+</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Appointment Cancellation</p>
        </div>
        <div style="${bodyStyle}">
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>Your appointment has been cancelled:</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Doctor:</strong> ${data.doctorName}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${data.date}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${data.time}</p>
            ${data.reason ? `<p style="margin: 4px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          <p>You can book a new appointment through your patient portal.</p>
        </div>
      </div>
    `,
  };
}

export function leaveNotificationEmail(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}): EmailOptions {
  return {
    to: '',
    subject: `⚠️ Appointment Rescheduling Required - Dr. ${data.doctorName}`,
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">🏥 HealthCare+</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Schedule Change Notice</p>
        </div>
        <div style="${bodyStyle}">
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>We regret to inform you that <strong>${data.doctorName}</strong> will be unavailable on <strong>${data.date}</strong>.</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Your cancelled appointment:</strong></p>
            <p style="margin: 4px 0;">Date: ${data.date} at ${data.time}</p>
          </div>
          <p>Please log in to your patient portal to book a new appointment at your convenience.</p>
          <p>We apologize for any inconvenience caused.</p>
        </div>
      </div>
    `,
  };
}

export function medicationReminderEmail(data: {
  patientName: string;
  medication: string;
  dosage: string;
}): EmailOptions {
  return {
    to: '',
    subject: `💊 Medication Reminder - ${data.medication}`,
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">🏥 HealthCare+</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Medication Reminder</p>
        </div>
        <div style="${bodyStyle}">
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>This is your medication reminder:</p>
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Medication:</strong> ${data.medication}</p>
            <p style="margin: 4px 0;"><strong>Dosage:</strong> ${data.dosage}</p>
          </div>
          <p>Please take your medication as prescribed by your doctor.</p>
        </div>
      </div>
    `,
  };
}
