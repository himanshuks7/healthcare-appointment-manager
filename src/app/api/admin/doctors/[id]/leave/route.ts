import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, format } from 'date-fns';
import { sendEmail, cancellationEmail } from '@/lib/services/email-service';

// POST /api/admin/doctors/[id]/leave - Add leave day
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { leaveDate, reason } = body;

    if (!leaveDate) {
      return NextResponse.json({ error: 'Leave date is required' }, { status: 400 });
    }

    const doctor = await prisma.user.findFirst({
      where: { id, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const parsedDate = new Date(leaveDate);
    const dateStart = startOfDay(parsedDate);

    // Create leave entry
    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: doctor.doctorProfile.id,
        leaveDate: dateStart,
        reason: reason || null,
      },
    });

    // Find affected appointments on that date
    const affectedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.doctorProfile.id,
        slotStart: { gte: dateStart, lte: endOfDay(parsedDate) },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        patient: { select: { name: true, email: true } },
      },
    });

    // Cancel affected appointments and notify patients
    if (affectedAppointments.length > 0) {
      await prisma.appointment.updateMany({
        where: {
          id: { in: affectedAppointments.map((a) => a.id) },
        },
        data: { status: 'CANCELLED' },
      });

      // Notify affected patients
      for (const appt of affectedAppointments) {
        const emailData = cancellationEmail({
          patientName: appt.patient.name,
          doctorName: doctor.name,
          date: format(new Date(appt.slotStart), 'dd MMM yyyy'),
          time: format(new Date(appt.slotStart), 'hh:mm a'),
          reason: `Dr. ${doctor.name} is on leave on this date`,
        });
        emailData.to = appt.patient.email;
        sendEmail(emailData).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      leave,
      affectedAppointments: affectedAppointments.length,
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Leave already exists for this date' }, { status: 409 });
    }
    console.error('Failed to add leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/doctors/[id]/leave - Remove leave day
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get('leaveId');

    if (!leaveId) {
      return NextResponse.json({ error: 'Leave ID is required' }, { status: 400 });
    }

    await prisma.doctorLeave.delete({ where: { id: leaveId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
