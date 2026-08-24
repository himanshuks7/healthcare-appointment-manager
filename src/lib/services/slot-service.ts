import { format, addMinutes, parse, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import prisma from '@/lib/prisma';
import type { TimeSlot } from '@/types';

/**
 * Generates available time slots for a doctor on a given date.
 * Excludes already booked slots, held slots, and leave days.
 */
export async function getAvailableSlots(
  doctorProfileId: string,
  date: Date
): Promise<TimeSlot[]> {
  // Get doctor profile
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorProfileId },
    include: { leaveDays: true },
  });

  if (!doctor || !doctor.isActive) {
    return [];
  }

  // Check if doctor is on leave
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  const isOnLeave = doctor.leaveDays.some(
    (leave) => {
      const leaveDate = startOfDay(new Date(leave.leaveDate));
      return leaveDate.getTime() === dayStart.getTime();
    }
  );

  if (isOnLeave) {
    return [];
  }

  // Check if the date falls on a working day
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, etc.
  const workingDays = doctor.workingDays.split(',').map(Number);
  if (!workingDays.includes(dayOfWeek)) {
    return [];
  }

  // Generate all possible slots
  const slots: TimeSlot[] = [];
  const dateStr = format(date, 'yyyy-MM-dd');
  let currentSlotStart = parse(
    `${dateStr} ${doctor.workingHoursStart}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );
  const workEnd = parse(
    `${dateStr} ${doctor.workingHoursEnd}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );

  while (isBefore(addMinutes(currentSlotStart, doctor.slotDurationMinutes), workEnd) || 
         addMinutes(currentSlotStart, doctor.slotDurationMinutes).getTime() === workEnd.getTime()) {
    const slotEnd = addMinutes(currentSlotStart, doctor.slotDurationMinutes);
    slots.push({
      start: currentSlotStart.toISOString(),
      end: slotEnd.toISOString(),
      available: true,
    });
    currentSlotStart = slotEnd;
  }

  // Get existing appointments for this doctor on this date
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorProfileId,
      slotStart: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [
        { holdExpiresAt: null },
        { holdExpiresAt: { gt: new Date() } },
      ],
    },
  });

  // Mark booked slots as unavailable
  const bookedStarts = new Set(
    existingAppointments.map((appt) => new Date(appt.slotStart).getTime())
  );

  // Filter out past slots if the date is today
  const now = new Date();

  return slots.map((slot) => ({
    ...slot,
    available:
      !bookedStarts.has(new Date(slot.start).getTime()) &&
      isAfter(new Date(slot.start), now),
  }));
}

/**
 * Creates a slot hold for a patient (5-minute temporary reservation).
 * Uses optimistic locking to prevent double-booking.
 */
export async function holdSlot(
  doctorProfileId: string,
  patientId: string,
  slotStart: Date,
  slotEnd: Date
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    // Check for existing active booking at this slot
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorProfileId,
        slotStart: slotStart,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { holdExpiresAt: null },
          { holdExpiresAt: { gt: new Date() } },
        ],
      },
    });

    if (existing) {
      return { success: false, error: 'This slot is no longer available' };
    }

    // Create appointment with hold
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: doctorProfileId,
        slotStart,
        slotEnd,
        status: 'PENDING',
        holdExpiresAt: addMinutes(new Date(), 5), // 5-minute hold
        version: 1,
      },
    });

    return { success: true, appointmentId: appointment.id };
  } catch (error: any) {
    // Handle unique constraint violation (concurrent booking)
    if (error.code === 'P2002') {
      return { success: false, error: 'This slot was just booked by another patient' };
    }
    throw error;
  }
}

/**
 * Confirms a held appointment after symptoms are submitted.
 * Uses version check for optimistic locking.
 */
export async function confirmAppointment(
  appointmentId: string,
  symptoms: string,
  expectedVersion: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const updated = await prisma.appointment.updateMany({
      where: {
        id: appointmentId,
        status: 'PENDING',
        version: expectedVersion,
        holdExpiresAt: { gt: new Date() },
      },
      data: {
        status: 'CONFIRMED',
        symptoms,
        holdExpiresAt: null,
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      return { success: false, error: 'Slot hold has expired or was modified. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to confirm appointment' };
  }
}

/**
 * Cleans up expired slot holds (called by background job).
 */
export async function cleanupExpiredHolds(): Promise<number> {
  const result = await prisma.appointment.deleteMany({
    where: {
      status: 'PENDING',
      holdExpiresAt: { lte: new Date() },
    },
  });

  return result.count;
}
