'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, UserCheck, AlertTriangle } from 'lucide-react';

interface Stats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  recentAppointments: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>
          Admin Dashboard
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '120px' }} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      icon: <Users size={24} />,
      color: '#0d9488',
      bg: 'rgba(13, 148, 136, 0.1)',
    },
    {
      label: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: <UserCheck size={24} />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      label: 'Total Appointments',
      value: stats?.totalAppointments || 0,
      icon: <Calendar size={24} />,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
    {
      label: 'Pending',
      value: stats?.pendingAppointments || 0,
      icon: <AlertTriangle size={24} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Overview of the healthcare platform
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {statCards.map((card, index) => (
          <div
            key={index}
            className="stat-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  {card.label}
                </p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: card.color }}>
                  {card.value}
                </p>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Appointments</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
                stats.recentAppointments.map((appt: any) => (
                  <tr key={appt.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {appt.patient?.name}
                    </td>
                    <td>{appt.doctor?.user?.name}</td>
                    <td>
                      {new Date(appt.slotStart).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(appt.slotStart).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className={`badge badge-${appt.status.toLowerCase()}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      {appt.urgencyLevel ? (
                        <span className={`badge badge-${appt.urgencyLevel.toLowerCase()}`}>
                          {appt.urgencyLevel}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No appointments yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
