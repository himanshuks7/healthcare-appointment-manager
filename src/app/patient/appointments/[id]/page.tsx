'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Brain, Pill, AlertTriangle, Calendar, XCircle, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAppointment(); }, []);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`);
      const data = await res.json();
      setAppointment(data.appointment);
    } catch { toast.error('Failed to load appointment'); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (res.ok) { toast.success('Appointment cancelled'); fetchAppointment(); }
      else toast.error('Failed to cancel');
    } catch { toast.error('Failed to cancel'); }
  };

  if (loading) return <div><div className="skeleton" style={{ height: '400px' }} /></div>;
  if (!appointment) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Appointment not found</div>;

  const preVisitSummary = appointment.preVisitSummary ? JSON.parse(appointment.preVisitSummary) : null;
  const postVisitSummary = appointment.postVisitSummary ? JSON.parse(appointment.postVisitSummary) : null;

  return (
    <div className="animate-fade-in">
      <button className="btn-secondary" style={{ marginBottom: '24px' }} onClick={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Appointment Details</h1>
          <span className={`badge badge-${appointment.status.toLowerCase()}`}>{appointment.status}</span>
          {appointment.urgencyLevel && <span className={`badge badge-${appointment.urgencyLevel.toLowerCase()}`} style={{ marginLeft: '8px' }}>{appointment.urgencyLevel}</span>}
        </div>
        {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
          <button className="btn-danger" onClick={handleCancel}><XCircle size={16} /> Cancel</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Appointment Info */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            <Calendar size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Appointment Info
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Doctor</p><p style={{ fontWeight: 600 }}>{appointment.doctor?.user?.name}</p><p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{appointment.doctor?.specialisation}</p></div>
            <div><p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Date & Time</p><p style={{ fontWeight: 600 }}>{new Date(appointment.slotStart).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(appointment.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(appointment.slotEnd).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Your Symptoms</p><p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{appointment.symptoms || 'Not provided'}</p></div>
          </div>
        </div>

        {/* AI Pre-visit Summary */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            <Brain size={20} style={{ display: 'inline', marginRight: '8px' }} />
            AI Symptom Analysis
          </h2>
          {preVisitSummary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Chief Complaint</p>
                <p style={{ fontWeight: 600 }}>{preVisitSummary.chiefComplaint}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Summary</p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{preVisitSummary.briefSummary}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Suggested Questions</p>
                {preVisitSummary.suggestedQuestions?.map((q: string, i: number) => (
                  <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', paddingLeft: '12px', borderLeft: '2px solid var(--teal-600)' }}>{q}</p>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>AI analysis is being generated...</p>
          )}
        </div>
      </div>

      {/* Post-visit Summary */}
      {postVisitSummary && (
        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            <ClipboardList size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Post-Visit Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>What Was Found</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{postVisitSummary.whatWasFound}</p>
              
              {postVisitSummary.followUpSteps && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Follow-up Steps</p>
                  {postVisitSummary.followUpSteps.map((step: string, i: number) => (
                    <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{i + 1}. {step}</p>
                  ))}
                </div>
              )}
            </div>
            <div>
              {postVisitSummary.medicationSchedule && (
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Pill size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Medication Schedule
                  </p>
                  {postVisitSummary.medicationSchedule.map((med: any, i: number) => (
                    <div key={i} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px' }}>{med.medication}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{med.dosage} — {med.frequency} — {med.duration}</p>
                    </div>
                  ))}
                </div>
              )}

              {postVisitSummary.warningSignsToWatch && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Warning Signs
                  </p>
                  {postVisitSummary.warningSignsToWatch.map((sign: string, i: number) => (
                    <p key={i} style={{ fontSize: '13px', color: '#f87171', marginBottom: '4px' }}>• {sign}</p>
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
