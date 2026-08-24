'use client';

import DashboardShell from '@/components/DashboardShell';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell requiredRole="DOCTOR">{children}</DashboardShell>;
}
