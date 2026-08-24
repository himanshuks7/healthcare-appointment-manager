import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/services/slot-service';

// GET /api/doctors/[id]/slots?date=YYYY-MM-DD - Get available slots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // If view=schedule, don't filter past slots (for doctor's own schedule view)
    const view = searchParams.get('view');
    const filterPastSlots = view !== 'schedule';

    const slots = await getAvailableSlots(id, date, filterPastSlots);

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Failed to fetch slots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
