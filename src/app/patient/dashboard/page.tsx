'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {} finally { setLoading(false); }
  };

  const upcoming = appointments.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.slotStart) > new Date());
  const past = appointments.filter(a => a.status === 'COMPLETED');
  const cancelled = appointments.filter(a => a.status === 'CANCELLED');

  const statCards = [
    { label: 'Upcoming', value: upcoming.length, icon: <Calendar size={24} />, color: '#0d9488' },
    { label: 'Completed', value: past.length, icon: <CheckCircle size={24} />, color: '#3b82f6' },
    { label: 'Cancelled', value: cancelled.length, icon: <XCircle size={24} />, color: '#ef4444' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          Welcome, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Here&apos;s your appointment overview</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{card.label}</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: card.color }}>{card.value}</p>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <Link href="/patient/doctors">
          <button className="btn-primary" style={{ padding: '14px 24px' }}>
            <Calendar size={18} /> Book New Appointment
          </button>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Upcoming Appointments</h2>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No upcoming appointments</p>
            <Link href="/patient/doctors">
              <button className="btn-primary" style={{ marginTop: '16px' }}>Find a Doctor</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcoming.map((appt) => (
              <Link key={appt.id} href={`/patient/appointments/${appt.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(13, 148, 136, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', fontWeight: 700 }}>
                      {appt.doctor?.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '15px' }}>{appt.doctor?.user?.name}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{appt.doctor?.specialisation}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>
                      {new Date(appt.slotStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(appt.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
