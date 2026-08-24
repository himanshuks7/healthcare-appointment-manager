'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

export default function DoctorAppointmentsPage() {
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

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>Patient</th><th>Date & Time</th><th>Status</th><th>Urgency</th><th>Symptoms</th><th>Action</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No appointments</td></tr>
            ) : filtered.map((appt) => (
              <tr key={appt.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{appt.patient?.name}<br/><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{appt.patient?.email}</span></td>
                <td>{new Date(appt.slotStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}<br/><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(appt.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></td>
                <td><span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span></td>
                <td>{appt.urgencyLevel ? <span className={`badge badge-${appt.urgencyLevel.toLowerCase()}`}>{appt.urgencyLevel}</span> : '—'}</td>
                <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.symptoms || '—'}</td>
                <td>
                  <Link href={`/doctor/appointments/${appt.id}`}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>View</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
