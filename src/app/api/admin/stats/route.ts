import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();

    const [totalDoctors, totalPatients, totalAppointments, pendingAppointments, todayAppointments, recentAppointments] =
      await Promise.all([
        prisma.user.count({ where: { role: 'DOCTOR' } }),
        prisma.user.count({ where: { role: 'PATIENT' } }),
        prisma.appointment.count(),
        prisma.appointment.count({ where: { status: 'PENDING' } }),
        prisma.appointment.count({
          where: {
            slotStart: { gte: startOfDay(today), lte: endOfDay(today) },
          },
        }),
        prisma.appointment.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: { select: { id: true, name: true, email: true } },
            doctor: {
              select: {
                id: true,
                specialisation: true,
                user: { select: { name: true } },
              },
            },
          },
        }),
      ]);

    return NextResponse.json({
      totalDoctors,
      totalPatients,
      totalAppointments,
      pendingAppointments,
      todayAppointments,
      recentAppointments,
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
