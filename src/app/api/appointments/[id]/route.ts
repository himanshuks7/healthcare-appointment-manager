import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generatePostVisitSummary } from '@/lib/services/llm-service';
import { sendEmail, cancellationEmail } from '@/lib/services/email-service';
import { format } from 'date-fns';

// GET /api/appointments/[id] - Get appointment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        doctor: {
          select: {
            id: true,
            specialisation: true,
            qualification: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        medicationReminders: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Failed to fetch appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/appointments/[id] - Update appointment (cancel, complete, add notes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, postVisitNotes, prescription } = body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { name: true, email: true } },
        doctor: {
          select: {
            specialisation: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Handle cancel
    if (action === 'cancel') {
      await prisma.appointment.update({
        where: { id },
        data: { status: 'CANCELLED', version: { increment: 1 } },
      });

      // Notify patient
      const emailData = cancellationEmail({
        patientName: appointment.patient.name,
        doctorName: appointment.doctor.user.name,
        date: format(new Date(appointment.slotStart), 'dd MMM yyyy'),
        time: format(new Date(appointment.slotStart), 'hh:mm a'),
      });
      emailData.to = appointment.patient.email;
      sendEmail(emailData).catch(console.error);

      return NextResponse.json({ success: true, message: 'Appointment cancelled' });
    }

    // Handle complete with post-visit notes
    if (action === 'complete' && postVisitNotes) {
      const updateData: any = {
        status: 'COMPLETED',
        postVisitNotes,
        prescription: prescription || null,
        version: { increment: 1 },
      };

      await prisma.appointment.update({
        where: { id },
        data: updateData,
      });

      // Generate post-visit summary async
      generatePostVisitSummary(postVisitNotes, prescription || '').then(async (llmResult) => {
        if (llmResult.success && llmResult.data) {
          await prisma.appointment.update({
            where: { id },
            data: { postVisitSummary: JSON.stringify(llmResult.data) },
          });

          // Create medication reminders from summary
          if (llmResult.data.medicationSchedule) {
            for (const med of llmResult.data.medicationSchedule) {
              if (med.medication !== 'No specific medication prescribed') {
                await prisma.medicationReminder.create({
                  data: {
                    appointmentId: id,
                    patientId: appointment.patientId,
                    medication: med.medication,
                    dosage: med.dosage,
                    frequency: med.frequency,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
                    nextReminderAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
                    isActive: true,
                  },
                });
              }
            }
          }
        }
      }).catch(console.error);

      return NextResponse.json({ success: true, message: 'Visit completed' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
