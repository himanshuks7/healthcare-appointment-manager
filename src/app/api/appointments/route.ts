import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { holdSlot, confirmAppointment } from '@/lib/services/slot-service';
import { generatePreVisitSummary } from '@/lib/services/llm-service';
import { sendEmail, bookingConfirmationEmail } from '@/lib/services/email-service';
import { format } from 'date-fns';

// GET /api/appointments - Get appointments for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};

    if (session.user.role === 'PATIENT') {
      where.patientId = session.user.id;
    } else if (session.user.role === 'DOCTOR') {
      where.doctorId = session.user.doctorProfileId;
    }

    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
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
      },
      orderBy: { slotStart: 'desc' },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/appointments - Book a new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { doctorProfileId, slotStart, slotEnd, symptoms } = body;

    if (!doctorProfileId || !slotStart || !slotEnd) {
      return NextResponse.json(
        { error: 'Doctor, slot start, and slot end are required' },
        { status: 400 }
      );
    }

    // Step 1: Hold the slot
    const holdResult = await holdSlot(
      doctorProfileId,
      session.user.id,
      new Date(slotStart),
      new Date(slotEnd)
    );

    if (!holdResult.success) {
      return NextResponse.json({ error: holdResult.error }, { status: 409 });
    }

    // Step 2: If symptoms provided, confirm immediately with LLM summary
    if (symptoms && holdResult.appointmentId) {
      const confirmResult = await confirmAppointment(holdResult.appointmentId, symptoms, 1);

      if (!confirmResult.success) {
        return NextResponse.json({ error: confirmResult.error }, { status: 409 });
      }

      // Step 3: Generate pre-visit summary (async, don't block)
      generatePreVisitSummary(symptoms).then(async (llmResult) => {
        if (llmResult.success && llmResult.data) {
          await prisma.appointment.update({
            where: { id: holdResult.appointmentId },
            data: {
              preVisitSummary: JSON.stringify(llmResult.data),
              urgencyLevel: llmResult.data.urgencyLevel,
            },
          });
        }
      }).catch(console.error);

      // Step 4: Send confirmation email (async)
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: doctorProfileId },
        include: { user: true },
      });

      if (doctor) {
        const emailData = bookingConfirmationEmail({
          patientName: session.user.name,
          doctorName: doctor.user.name,
          specialisation: doctor.specialisation,
          date: format(new Date(slotStart), 'dd MMM yyyy'),
          time: format(new Date(slotStart), 'hh:mm a'),
          appointmentId: holdResult.appointmentId!,
        });

        // Send to patient
        emailData.to = session.user.email;
        sendEmail(emailData).catch(console.error);

        // Send to doctor
        const doctorEmailData = { ...emailData };
        doctorEmailData.to = doctor.user.email;
        doctorEmailData.subject = `📋 New Appointment - ${session.user.name}`;
        sendEmail(doctorEmailData).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      appointmentId: holdResult.appointmentId,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to book appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
