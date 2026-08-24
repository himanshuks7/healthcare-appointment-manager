'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import type { UserRole } from '@/types';

interface DashboardShellProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export default function DashboardShell({ children, requiredRole }: DashboardShellProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="animate-pulse-glow" style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
        }} />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar role={session.user.role as UserRole} userName={session.user.name || ''} />
      <main
        style={{
          flex: 1,
          marginLeft: '260px',
          padding: '32px',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  );
}
