'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, User, Clock, Calendar, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: 'password123',
    specialisation: '', qualification: '', bio: '',
    slotDurationMinutes: 30, workingHoursStart: '09:00', workingHoursEnd: '17:00',
    workingDays: '1,2,3,4,5',
  });

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/admin/doctors');
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Doctor created successfully');
        setShowAddModal(false);
        fetchDoctors();
        setFormData({ name: '', email: '', phone: '', password: 'password123', specialisation: '', qualification: '', bio: '', slotDurationMinutes: 30, workingHoursStart: '09:00', workingHoursEnd: '17:00', workingDays: '1,2,3,4,5' });
      } else {
        toast.error(data.error || 'Failed to create doctor');
      }
    } catch { toast.error('Failed to create doctor'); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this doctor?')) return;
    try {
      const res = await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Doctor deactivated');
        fetchDoctors();
      }
    } catch { toast.error('Failed to deactivate doctor'); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Manage Doctors</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Create and manage doctor profiles</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      {/* Doctor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {doctors.map((doctor: any) => (
          <div key={doctor.id} className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(13, 148, 136, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', fontSize: '18px', fontWeight: 700 }}>
                  {doctor.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{doctor.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{doctor.email}</p>
                </div>
              </div>
              <span className={`badge ${doctor.doctorProfile?.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                {doctor.doctorProfile?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <User size={14} /> {doctor.doctorProfile?.specialisation} — {doctor.doctorProfile?.qualification}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Clock size={14} /> {doctor.doctorProfile?.workingHoursStart} - {doctor.doctorProfile?.workingHoursEnd} ({doctor.doctorProfile?.slotDurationMinutes}min slots)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Calendar size={14} /> {doctor.doctorProfile?._count?.appointments || 0} appointments
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href={`/admin/doctors/${doctor.id}`}>
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  <Edit size={14} /> Edit
                </button>
              </Link>
              <button className="btn-danger" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => handleDeactivate(doctor.id)}>
                <Trash2 size={14} /> Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Add New Doctor</h2>
            <form onSubmit={handleAddDoctor}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name *</label>
                  <input className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email *</label>
                  <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Phone</label>
                  <input className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password *</label>
                  <input className="input-field" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Specialisation *</label>
                  <input className="input-field" value={formData.specialisation} onChange={(e) => setFormData({ ...formData, specialisation: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Qualification *</label>
                  <input className="input-field" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Working Hours Start</label>
                  <input type="time" className="input-field" value={formData.workingHoursStart} onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Working Hours End</label>
                  <input type="time" className="input-field" value={formData.workingHoursEnd} onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Slot Duration (min)</label>
                  <input type="number" className="input-field" value={formData.slotDurationMinutes} onChange={(e) => setFormData({ ...formData, slotDurationMinutes: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Working Days</label>
                  <input className="input-field" value={formData.workingDays} onChange={(e) => setFormData({ ...formData, workingDays: e.target.value })} placeholder="1,2,3,4,5" />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Bio</label>
                <textarea className="input-field" rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
