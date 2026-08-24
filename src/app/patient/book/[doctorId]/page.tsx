'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, AlertCircle, CheckCircle, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const doctorProfileId = params.doctorId as string;
  
  const [step, setStep] = useState(1); // 1: select date/slot, 2: symptoms, 3: confirmed
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedDate) fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/doctors/${doctorProfileId}/slots?date=${selectedDate}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      toast.error('Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !symptoms.trim()) {
      toast.error('Please fill in your symptoms');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorProfileId,
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
          symptoms: symptoms.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAppointmentId(data.appointmentId);
        setStep(3);
        toast.success('Appointment booked successfully!');
      } else {
        toast.error(data.error || 'Failed to book appointment');
      }
    } catch {
      toast.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = slots.filter(s => s.available);

  return (
    <div className="animate-fade-in">
      <button className="btn-secondary" style={{ marginBottom: '24px' }} onClick={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>Book Appointment</h1>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
        {['Select Slot', 'Describe Symptoms', 'Confirmed'].map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: '4px', borderRadius: '2px',
              background: step > i ? 'linear-gradient(90deg, #0d9488, #14b8a6)' : 'var(--bg-card)',
              marginBottom: '8px', transition: 'all 0.3s ease',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: step > i ? '#14b8a6' : 'var(--text-muted)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Date & Slot */}
      {step === 1 && (
        <div>
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              <Calendar size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Select Date
            </h2>
            <input type="date" className="input-field" style={{ maxWidth: '300px' }}
              value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
              min={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              <Clock size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Available Slots {selectedDate && `— ${new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
            </h2>

            {slotsLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '44px' }} />)}
              </div>
            ) : availableSlots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <AlertCircle size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>No available slots on this date</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>Try selecting a different date</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                {availableSlots.map((slot, i) => {
                  const isSelected = selectedSlot?.start === slot.start;
                  return (
                    <button key={i} onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '12px', borderRadius: '10px', cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, #0d9488, #0f766e)' : 'var(--bg-secondary)',
                        border: `1px solid ${isSelected ? '#0d9488' : 'var(--border-color)'}`,
                        color: isSelected ? 'white' : 'var(--text-primary)',
                        fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                        textAlign: 'center',
                      }}>
                      {new Date(slot.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlot && (
              <button className="btn-primary" style={{ marginTop: '24px', padding: '14px 32px' }}
                onClick={() => setStep(2)}>
                Continue — {new Date(selectedSlot.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            <Brain size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Describe Your Symptoms
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            Our AI will analyse your symptoms and prepare a summary for the doctor.
          </p>

          <div style={{ background: 'rgba(13, 148, 136, 0.05)', border: '1px solid rgba(13, 148, 136, 0.1)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Selected Slot</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {new Date(selectedSlot?.start).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(selectedSlot?.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <textarea className="input-field" rows={6} placeholder="Describe your symptoms in detail. Include:
• What symptoms are you experiencing?
• When did they start?
• How severe are they? (mild/moderate/severe)
• Any medications you're currently taking?
• Any known allergies?"
            value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
            style={{ resize: 'vertical', lineHeight: 1.7 }} />

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" onClick={handleBookAppointment} disabled={loading || !symptoms.trim()}>
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(13, 148, 136, 0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <CheckCircle size={36} color="#14b8a6" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Appointment Booked!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '8px' }}>
            Your appointment has been confirmed.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px' }}>
            An AI summary of your symptoms is being generated for the doctor.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => router.push(`/patient/appointments/${appointmentId}`)}>
              View Appointment
            </button>
            <button className="btn-secondary" onClick={() => router.push('/patient/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
