'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  Stethoscope,
  UserPlus,
  CalendarOff,
  Search,
  ClipboardList,
  Brain,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  userName: string;
}

const menuItems = {
  ADMIN: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/doctors', label: 'Manage Doctors', icon: Users },
    { href: '/admin/appointments', label: 'All Appointments', icon: Calendar },
  ],
  DOCTOR: [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/appointments', label: 'My Appointments', icon: Calendar },
    { href: '/doctor/schedule', label: 'My Schedule', icon: ClipboardList },
  ],
  PATIENT: [
    { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/patient/doctors', label: 'Find Doctors', icon: Search },
    { href: '/patient/appointments', label: 'My Appointments', icon: Calendar },
  ],
};

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();

  const roleColors = {
    ADMIN: { bg: '#7c3aed', label: 'Administrator' },
    DOCTOR: { bg: '#0d9488', label: 'Doctor' },
    PATIENT: { bg: '#3b82f6', label: 'Patient' },
  };

  const { bg, label } = roleColors[role];

  return (
    <div className="sidebar">
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Stethoscope size={22} color="white" />
        </div>
        <div>
          <span
            style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}
            className="gradient-text"
          >
            HealthCare+
          </span>
        </div>
      </div>

      {/* User Info */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `${bg}20`,
              border: `1px solid ${bg}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: bg,
              fontSize: '16px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '150px',
              }}
            >
              {userName}
            </p>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: bg,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {label}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--text-muted)',
            padding: '0 24px',
            marginBottom: '8px',
          }}
        >
          Menu
        </p>
        {menuItems[role].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="sidebar-link"
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#f87171',
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
