import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/doctors - List doctors with optional specialisation filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialisation = searchParams.get('specialisation');
    const search = searchParams.get('search');

    const where: any = {
      role: 'DOCTOR',
      doctorProfile: { isActive: true },
    };

    if (specialisation) {
      where.doctorProfile.specialisation = {
        contains: specialisation,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { doctorProfile: { specialisation: { contains: search } } },
      ];
    }

    const doctors = await prisma.user.findMany({
      where,
      include: {
        doctorProfile: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get unique specialisations for filter
    const specialisations = await prisma.doctorProfile.findMany({
      where: { isActive: true },
      select: { specialisation: true },
      distinct: ['specialisation'],
    });

    return NextResponse.json({
      doctors,
      specialisations: specialisations.map((s) => s.specialisation),
    });
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
