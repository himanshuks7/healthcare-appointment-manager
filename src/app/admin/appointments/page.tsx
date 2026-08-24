'use client';

import { useEffect, useState } from 'react';
import { Calendar, Filter } from 'lucide-react';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchAppointments(); }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      const url = statusFilter ? `/api/appointments?status=${statusFilter}` : '/api/appointments';
      const res = await fetch(url);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>All Appointments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{appointments.length} total appointments</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button key={status} className={statusFilter === status ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setStatusFilter(status)}>
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Urgency</th>
              <th>Symptoms</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No appointments found
                </td>
              </tr>
            ) : appointments.map((appt: any) => (
              <tr key={appt.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{appt.patient?.name}</td>
                <td>{appt.doctor?.user?.name}<br/><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{appt.doctor?.specialisation}</span></td>
                <td>
                  {new Date(appt.slotStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(appt.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td><span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span></td>
                <td>{appt.urgencyLevel ? <span className={`badge badge-${appt.urgencyLevel.toLowerCase()}`}>{appt.urgencyLevel}</span> : '—'}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {appt.symptoms || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
