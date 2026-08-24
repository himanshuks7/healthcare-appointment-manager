import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/doctors/[id] - Get single doctor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doctor = await prisma.user.findFirst({
      where: { id, role: 'DOCTOR' },
      include: {
        doctorProfile: {
          include: {
            leaveDays: { orderBy: { leaveDate: 'asc' } },
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error) {
    console.error('Failed to fetch doctor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/doctors/[id] - Update doctor profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const doctor = await prisma.user.findFirst({
      where: { id, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Update user fields
    await prisma.user.update({
      where: { id },
      data: {
        name: body.name || doctor.name,
        phone: body.phone !== undefined ? body.phone : doctor.phone,
      },
    });

    // Update doctor profile
    await prisma.doctorProfile.update({
      where: { id: doctor.doctorProfile.id },
      data: {
        specialisation: body.specialisation || doctor.doctorProfile.specialisation,
        qualification: body.qualification || doctor.doctorProfile.qualification,
        bio: body.bio !== undefined ? body.bio : doctor.doctorProfile.bio,
        slotDurationMinutes: body.slotDurationMinutes || doctor.doctorProfile.slotDurationMinutes,
        workingHoursStart: body.workingHoursStart || doctor.doctorProfile.workingHoursStart,
        workingHoursEnd: body.workingHoursEnd || doctor.doctorProfile.workingHoursEnd,
        workingDays: body.workingDays || doctor.doctorProfile.workingDays,
        isActive: body.isActive !== undefined ? body.isActive : doctor.doctorProfile.isActive,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update doctor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/doctors/[id] - Deactivate doctor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doctor = await prisma.user.findFirst({
      where: { id, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    await prisma.doctorProfile.update({
      where: { id: doctor.doctorProfile.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to deactivate doctor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
