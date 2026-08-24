'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Calendar, Clock, AlertTriangle, Users, Brain, CheckCircle } from 'lucide-react';

export default function DoctorDashboard() {
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

  const today = new Date().toDateString();
  const todayAppts = appointments.filter(a => new Date(a.slotStart).toDateString() === today && ['CONFIRMED', 'PENDING'].includes(a.status));
  const upcoming = appointments.filter(a => new Date(a.slotStart) > new Date() && ['CONFIRMED', 'PENDING'].includes(a.status));
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  const highUrgency = appointments.filter(a => a.urgencyLevel === 'HIGH' && ['CONFIRMED', 'PENDING'].includes(a.status));

  const statCards = [
    { label: "Today's Schedule", value: todayAppts.length, icon: <Calendar size={24} />, color: '#0d9488' },
    { label: 'Total Upcoming', value: upcoming.length, icon: <Clock size={24} />, color: '#3b82f6' },
    { label: 'Completed', value: completed.length, icon: <CheckCircle size={24} />, color: '#8b5cf6' },
    { label: 'High Urgency', value: highUrgency.length, icon: <AlertTriangle size={24} />, color: '#ef4444' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {session?.user?.name?.split(' ').pop()} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
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

      {/* Today's Appointments */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Today&apos;s Appointments</h2>
          <Link href="/doctor/appointments">
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>View All</button>
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div>
            {todayAppts.map((appt) => {
              const preVisit = appt.preVisitSummary ? JSON.parse(appt.preVisitSummary) : null;
              return (
                <Link key={appt.id} href={`/doctor/appointments/${appt.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700 }}>
                        {appt.patient?.name?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '15px' }}>{appt.patient?.name}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {new Date(appt.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {appt.urgencyLevel && <span className={`badge badge-${appt.urgencyLevel.toLowerCase()}`}>{appt.urgencyLevel}</span>}
                      {preVisit && (
                        <span style={{ fontSize: '12px', color: '#14b8a6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Brain size={14} /> AI Summary
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
