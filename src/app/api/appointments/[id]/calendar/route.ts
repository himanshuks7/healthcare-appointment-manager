import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

// GET /api/appointments/[id]/calendar - Download .ics calendar file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const startDate = new Date(appointment.slotStart);
    const endDate = new Date(appointment.slotEnd);

    // Format dates for ICS (YYYYMMDDTHHmmssZ)
    const formatICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const uid = `${appointment.id}@healthcareplus.app`;
    const now = formatICS(new Date());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HealthCare+//Appointment//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICS(startDate)}`,
      `DTEND:${formatICS(endDate)}`,
      `SUMMARY:Medical Appointment - Dr. ${appointment.doctor.user.name}`,
      `DESCRIPTION:Appointment with Dr. ${appointment.doctor.user.name} (${appointment.doctor.specialisation})\\nPatient: ${appointment.patient.name}\\n${appointment.symptoms ? 'Symptoms: ' + appointment.symptoms.substring(0, 200) : ''}`,
      `LOCATION:HealthCare+ Clinic`,
      `ORGANIZER;CN=HealthCare+:mailto:noreply@healthcareapp.com`,
      `ATTENDEE;CN=${appointment.patient.name};RSVP=TRUE:mailto:${appointment.patient.email}`,
      `ATTENDEE;CN=Dr. ${appointment.doctor.user.name};RSVP=TRUE:mailto:${appointment.doctor.user.email}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Appointment with Dr. ${appointment.doctor.user.name} in 30 minutes`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Appointment with Dr. ${appointment.doctor.user.name} tomorrow`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="appointment-${appointment.id.substring(0, 8)}.ics"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate calendar file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
