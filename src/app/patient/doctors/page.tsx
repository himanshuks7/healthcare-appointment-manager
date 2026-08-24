'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Clock, Star, Filter } from 'lucide-react';

export default function PatientDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDoctors(); }, [selectedSpec]);

  const fetchDoctors = async () => {
    try {
      let url = '/api/doctors';
      const params = new URLSearchParams();
      if (selectedSpec) params.set('specialisation', selectedSpec);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setDoctors(data.doctors || []);
      setSpecialisations(data.specialisations || []);
    } catch {} finally { setLoading(false); }
  };

  const filteredDoctors = searchQuery
    ? doctors.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.doctorProfile?.specialisation.toLowerCase().includes(searchQuery.toLowerCase()))
    : doctors;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Find a Doctor</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Browse by specialisation and book an appointment</p>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: '44px' }} placeholder="Search doctors by name or specialisation..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={selectedSpec === '' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '10px 16px', fontSize: '13px' }} onClick={() => setSelectedSpec('')}>
            All
          </button>
          {specialisations.map((spec) => (
            <button key={spec} className={selectedSpec === spec ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '10px 16px', fontSize: '13px' }} onClick={() => setSelectedSpec(spec)}>
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredDoctors.map((doctor: any) => (
          <div key={doctor.id} className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(13, 148, 136, 0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#14b8a6', fontSize: '22px', fontWeight: 800, flexShrink: 0,
              }}>
                {doctor.name.split(' ').slice(-1)[0].charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>{doctor.name}</h3>
                <span className="badge badge-confirmed" style={{ fontSize: '11px' }}>
                  {doctor.doctorProfile?.specialisation}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {doctor.doctorProfile?.qualification}
            </p>
            {doctor.doctorProfile?.bio && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                {doctor.doctorProfile.bio}
              </p>
            )}

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {doctor.doctorProfile?.slotDurationMinutes} min
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {doctor.doctorProfile?.workingHoursStart} - {doctor.doctorProfile?.workingHoursEnd}
              </span>
            </div>

            <Link href={`/patient/book/${doctor.doctorProfile?.id}`}>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Book Appointment
              </button>
            </Link>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '16px' }}>No doctors found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
