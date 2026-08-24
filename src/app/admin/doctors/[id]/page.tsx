'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, CalendarOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => { fetchDoctor(); }, []);

  const fetchDoctor = async () => {
    try {
      const res = await fetch(`/api/admin/doctors/${params.id}`);
      const data = await res.json();
      setDoctor(data.doctor);
      setFormData({
        name: data.doctor.name,
        phone: data.doctor.phone || '',
        specialisation: data.doctor.doctorProfile?.specialisation || '',
        qualification: data.doctor.doctorProfile?.qualification || '',
        bio: data.doctor.doctorProfile?.bio || '',
        slotDurationMinutes: data.doctor.doctorProfile?.slotDurationMinutes || 30,
        workingHoursStart: data.doctor.doctorProfile?.workingHoursStart || '09:00',
        workingHoursEnd: data.doctor.doctorProfile?.workingHoursEnd || '17:00',
        workingDays: data.doctor.doctorProfile?.workingDays || '1,2,3,4,5',
        isActive: data.doctor.doctorProfile?.isActive ?? true,
      });
    } catch { toast.error('Failed to load doctor'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/doctors/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) toast.success('Doctor updated successfully');
      else toast.error('Failed to update');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleAddLeave = async () => {
    if (!leaveDate) return toast.error('Please select a date');
    try {
      const res = await fetch(`/api/admin/doctors/${params.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveDate, reason: leaveReason }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Leave added. ${data.affectedAppointments || 0} appointments affected.`);
        setLeaveDate('');
        setLeaveReason('');
        fetchDoctor();
      } else toast.error(data.error || 'Failed to add leave');
    } catch { toast.error('Failed to add leave'); }
  };

  const handleRemoveLeave = async (leaveId: string) => {
    try {
      const res = await fetch(`/api/admin/doctors/${params.id}/leave?leaveId=${leaveId}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Leave removed'); fetchDoctor(); }
    } catch { toast.error('Failed to remove leave'); }
  };

  if (loading) return <div><div className="skeleton" style={{ height: '400px' }} /></div>;

  return (
    <div className="animate-fade-in">
      <button className="btn-secondary" style={{ marginBottom: '24px' }} onClick={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>Edit Doctor — {doctor?.name}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Profile Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Profile Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Name', key: 'name', type: 'text' },
              { label: 'Phone', key: 'phone', type: 'text' },
              { label: 'Specialisation', key: 'specialisation', type: 'text' },
              { label: 'Qualification', key: 'qualification', type: 'text' },
              { label: 'Working Hours Start', key: 'workingHoursStart', type: 'time' },
              { label: 'Working Hours End', key: 'workingHoursEnd', type: 'time' },
              { label: 'Slot Duration (min)', key: 'slotDurationMinutes', type: 'number' },
              { label: 'Working Days (0=Sun..6=Sat)', key: 'workingDays', type: 'text' },
            ].map((field) => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>{field.label}</label>
                <input type={field.type} className="input-field" value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseInt(e.target.value) : e.target.value })} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Bio</label>
              <textarea className="input-field" rows={3} value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Active</label>
            </div>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Leave Management */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
            <CalendarOff size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Leave Management
          </h2>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input type="date" className="input-field" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} style={{ flex: 1 }} />
            <input className="input-field" placeholder="Reason (optional)" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} style={{ flex: 1 }} />
            <button className="btn-primary" style={{ padding: '10px 16px' }} onClick={handleAddLeave}>
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {doctor?.doctorProfile?.leaveDays?.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No leave days scheduled</p>
            )}
            {doctor?.doctorProfile?.leaveDays?.map((leave: any) => (
              <div key={leave.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>
                    {new Date(leave.leaveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {leave.reason && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{leave.reason}</p>}
                </div>
                <button onClick={() => handleRemoveLeave(leave.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '4px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
