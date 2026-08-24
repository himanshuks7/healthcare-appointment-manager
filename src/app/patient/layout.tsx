'use client';

import DashboardShell from '@/components/DashboardShell';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell requiredRole="PATIENT">{children}</DashboardShell>;
}
