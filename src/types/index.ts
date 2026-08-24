// Application-wide type definitions

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface DoctorWithProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  doctorProfile: {
    id: string;
    specialisation: string;
    qualification: string;
    bio: string | null;
    slotDurationMinutes: number;
    workingHoursStart: string;
    workingHoursEnd: string;
    workingDays: string;
    isActive: boolean;
  } | null;
}

export interface AppointmentWithDetails {
  id: string;
  patientId: string;
  doctorId: string;
  slotStart: string;
  slotEnd: string;
  status: AppointmentStatus;
  symptoms: string | null;
  preVisitSummary: string | null;
  urgencyLevel: UrgencyLevel | null;
  postVisitNotes: string | null;
  prescription: string | null;
  postVisitSummary: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  doctor: {
    id: string;
    specialisation: string;
    qualification: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface PreVisitSummary {
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  briefSummary: string;
}

export interface PostVisitSummary {
  whatWasFound: string;
  medicationSchedule: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  followUpSteps: string[];
  warningSignsToWatch: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
