'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Clock, Info } from 'lucide-react';

export default function DoctorSchedulePage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.doctorProfileId) fetchSlots();
  }, [selectedDate, session]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctors/${session?.user?.doctorProfileId}/slots?date=${selectedDate}&view=schedule`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {} finally { setLoading(false); }
  };

  const availableCount = slots.filter(s => s.available).length;
  const bookedCount = slots.filter(s => !s.available).length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>My Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>View your available and booked time slots</p>
      </div>

      {/* Date Picker */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Calendar size={20} color="#14b8a6" />
          <input type="date" className="input-field" style={{ maxWidth: '250px' }}
            value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(13, 148, 136, 0.3)' }} />
              Available ({availableCount})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.3)' }} />
              Booked ({bookedCount})
            </div>
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
          <Clock size={20} style={{ display: 'inline', marginRight: '8px' }} />
          Time Slots — {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: '64px' }} />)}
          </div>
        ) : slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <Info size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No slots available on this date</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>This could be a non-working day or a leave day</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {slots.map((slot, i) => (
              <div key={i} style={{
                padding: '16px', borderRadius: '10px', textAlign: 'center',
                background: slot.available ? 'rgba(13, 148, 136, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${slot.available ? 'rgba(13, 148, 136, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
              }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: slot.available ? '#14b8a6' : '#f87171' }}>
                  {new Date(slot.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {slot.available ? 'Available' : 'Booked'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
