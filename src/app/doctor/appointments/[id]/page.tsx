'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Brain, User, FileText, CheckCircle, Send, AlertTriangle, Pill } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [postVisitNotes, setPostVisitNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAppointment(); }, []);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`);
      const data = await res.json();
      setAppointment(data.appointment);
      if (data.appointment?.postVisitNotes) setPostVisitNotes(data.appointment.postVisitNotes);
      if (data.appointment?.prescription) setPrescription(data.appointment.prescription);
    } catch { toast.error('Failed to load appointment'); }
    finally { setLoading(false); }
  };

  const handleComplete = async () => {
    if (!postVisitNotes.trim()) return toast.error('Please add post-visit notes');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', postVisitNotes, prescription }),
      });
      if (res.ok) {
        toast.success('Visit completed! Patient summary is being generated.');
        fetchAppointment();
      } else toast.error('Failed to complete');
    } catch { toast.error('Failed to complete'); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (res.ok) { toast.success('Cancelled'); fetchAppointment(); }
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div><div className="skeleton" style={{ height: '500px' }} /></div>;
  if (!appointment) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Not found</div>;

  const preVisit = appointment.preVisitSummary ? JSON.parse(appointment.preVisitSummary) : null;
  const postVisit = appointment.postVisitSummary ? JSON.parse(appointment.postVisitSummary) : null;

  return (
    <div className="animate-fade-in">
      <button className="btn-secondary" style={{ marginBottom: '24px' }} onClick={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Patient Consultation</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className={`badge badge-${appointment.status.toLowerCase()}`}>{appointment.status}</span>
            {appointment.urgencyLevel && <span className={`badge badge-${appointment.urgencyLevel.toLowerCase()}`}>{appointment.urgencyLevel} Urgency</span>}
          </div>
        </div>
        {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
          <button className="btn-danger" onClick={handleCancel} style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Patient Info */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            <User size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Patient Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Name</p><p style={{ fontWeight: 600 }}>{appointment.patient?.name}</p></div>
            <div><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email</p><p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{appointment.patient?.email}</p></div>
            <div><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phone</p><p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{appointment.patient?.phone || 'Not provided'}</p></div>
            <div><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Appointment Time</p><p style={{ fontWeight: 600 }}>{new Date(appointment.slotStart).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(appointment.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reported Symptoms</p><p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>{appointment.symptoms || 'Not provided'}</p></div>
          </div>
        </div>

        {/* AI Pre-visit Summary */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            <Brain size={20} style={{ display: 'inline', marginRight: '8px', color: '#14b8a6' }} />
            AI Pre-Visit Summary
          </h2>
          {preVisit ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: appointment.urgencyLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.08)' : appointment.urgencyLevel === 'MEDIUM' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.08)', border: `1px solid ${appointment.urgencyLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : appointment.urgencyLevel === 'MEDIUM' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)'}` }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Urgency Assessment</p>
                <span className={`badge badge-${(appointment.urgencyLevel || 'low').toLowerCase()}`}>{appointment.urgencyLevel || 'PENDING'}</span>
              </div>
              <div><p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Chief Complaint</p><p style={{ fontWeight: 600, fontSize: '15px' }}>{preVisit.chiefComplaint}</p></div>
              <div><p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Clinical Summary</p><p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{preVisit.briefSummary}</p></div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Suggested Questions to Ask</p>
                {preVisit.suggestedQuestions?.map((q: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ background: 'rgba(13, 148, 136, 0.15)', color: '#14b8a6', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{q}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <Brain size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <p>AI summary is being generated...</p>
            </div>
          )}
        </div>
      </div>

      {/* Post-Visit Notes Form (only for CONFIRMED/PENDING) */}
      {['CONFIRMED', 'PENDING'].includes(appointment.status) && (
        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Post-Visit Notes
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Submit your clinical notes and prescription. An AI-powered patient-friendly summary will be generated automatically.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Clinical Notes *</label>
              <textarea className="input-field" rows={8} placeholder="Enter diagnosis, observations, and clinical findings..." value={postVisitNotes} onChange={(e) => setPostVisitNotes(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Prescription</label>
              <textarea className="input-field" rows={8} placeholder="Enter medications with dosage, frequency, and duration. One per line.&#10;&#10;Example:&#10;Amoxicillin 500mg - 3 times daily - 7 days&#10;Ibuprofen 400mg - as needed for pain - 5 days" value={prescription} onChange={(e) => setPrescription(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <button className="btn-primary" style={{ marginTop: '20px', padding: '14px 28px' }} onClick={handleComplete} disabled={submitting}>
            <CheckCircle size={18} /> {submitting ? 'Completing...' : 'Complete Visit & Generate Summary'}
          </button>
        </div>
      )}

      {/* Completed Summary */}
      {appointment.status === 'COMPLETED' && postVisit && (
        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            <CheckCircle size={20} style={{ display: 'inline', marginRight: '8px', color: '#14b8a6' }} />
            Generated Patient Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Patient-Friendly Explanation</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{postVisit.whatWasFound}</p>
              {postVisit.followUpSteps && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Follow-up Steps</p>
                  {postVisit.followUpSteps.map((s: string, i: number) => (
                    <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{i + 1}. {s}</p>
                  ))}
                </div>
              )}
            </div>
            <div>
              {postVisit.medicationSchedule && (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}><Pill size={14} style={{ display: 'inline', marginRight: '4px' }} />Medication Schedule</p>
                  {postVisit.medicationSchedule.map((m: any, i: number) => (
                    <div key={i} style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontWeight: 600, fontSize: '13px' }}>{m.medication}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.dosage} — {m.frequency}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
