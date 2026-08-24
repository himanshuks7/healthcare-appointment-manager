import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// GET /api/admin/doctors - List all doctors
export async function GET() {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: {
        doctorProfile: {
          include: {
            leaveDays: {
              where: { leaveDate: { gte: new Date() } },
              orderBy: { leaveDate: 'asc' },
            },
            _count: { select: { appointments: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/doctors - Create a new doctor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, email, phone, password,
      specialisation, qualification, bio,
      slotDurationMinutes, workingHoursStart, workingHoursEnd, workingDays,
    } = body;

    if (!name || !email || !password || !specialisation || !qualification) {
      return NextResponse.json(
        { error: 'Name, email, password, specialisation, and qualification are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const doctor = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialisation,
            qualification,
            bio: bio || null,
            slotDurationMinutes: slotDurationMinutes || 30,
            workingHoursStart: workingHoursStart || '09:00',
            workingHoursEnd: workingHoursEnd || '17:00',
            workingDays: workingDays || '1,2,3,4,5',
            isActive: true,
          },
        },
      },
      include: { doctorProfile: true },
    });

    return NextResponse.json({ success: true, doctor }, { status: 201 });
  } catch (error) {
    console.error('Failed to create doctor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
