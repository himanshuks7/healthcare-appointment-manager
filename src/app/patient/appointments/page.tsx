'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {} finally { setLoading(false); }
  };

  const filtered = filter ? appointments.filter(a => a.status === filter) : appointments;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>My Appointments</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>{appointments.length} total</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s} className={filter === s ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((appt) => (
          <Link key={appt.id} href={`/patient/appointments/${appt.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(13, 148, 136, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6', fontWeight: 700, fontSize: '18px' }}>
                  {appt.doctor?.user?.name?.charAt(0)}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{appt.doctor?.user?.name}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{appt.doctor?.specialisation}</p>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{new Date(appt.slotStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(appt.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {appt.urgencyLevel && <span className={`badge badge-${appt.urgencyLevel.toLowerCase()}`}>{appt.urgencyLevel}</span>}
                <span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No appointments found
          </div>
        )}
      </div>
    </div>
  );
}
