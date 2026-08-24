'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import {
  Calendar,
  Brain,
  Bell,
  Shield,
  ArrowRight,
  Stethoscope,
  ClipboardCheck,
  Clock,
} from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      const role = session.user.role.toLowerCase();
      router.push(`/${role}/dashboard`);
    }
  }, [session, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 48px',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10, 15, 26, 0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stethoscope size={22} color="white" />
          </div>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
            }}
            className="gradient-text"
          >
            HealthCare+
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => router.push('/login')}>
            Sign In
          </button>
          <button className="btn-primary" onClick={() => router.push('/register')}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          padding: '100px 48px 80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13, 148, 136, 0.15), transparent)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-100px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '9999px',
              background: 'rgba(13, 148, 136, 0.1)',
              border: '1px solid rgba(13, 148, 136, 0.2)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#2dd4bf',
              marginBottom: '24px',
            }}
          >
            <Brain size={14} />
            AI-Powered Healthcare Management
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '24px',
              letterSpacing: '-1.5px',
            }}
          >
            Smart Appointments.
            <br />
            <span className="gradient-text">Better Care.</span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              maxWidth: '640px',
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            A comprehensive healthcare platform that connects patients and doctors with
            AI-powered symptom analysis, automated scheduling, and intelligent follow-up care.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: '16px' }}
              onClick={() => router.push('/register')}
            >
              Book an Appointment <ArrowRight size={18} />
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '14px 32px', fontSize: '16px' }}
              onClick={() => router.push('/login')}
            >
              Doctor Login
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '40px 48px 100px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {[
            {
              icon: <Calendar size={28} />,
              title: 'Smart Scheduling',
              description:
                'Book appointments with real-time slot availability. Double-booking prevention ensures smooth operations.',
              color: '#0d9488',
            },
            {
              icon: <Brain size={28} />,
              title: 'AI Symptom Analysis',
              description:
                'LLM-powered pre-visit summaries with urgency levels help doctors prepare before consultations.',
              color: '#8b5cf6',
            },
            {
              icon: <ClipboardCheck size={28} />,
              title: 'Post-Visit Summaries',
              description:
                'Patient-friendly summaries with medication schedules and follow-up steps, generated by AI.',
              color: '#3b82f6',
            },
            {
              icon: <Bell size={28} />,
              title: 'Smart Notifications',
              description:
                'Email confirmations, appointment reminders, and medication alerts keep everyone informed.',
              color: '#f59e0b',
            },
            {
              icon: <Clock size={28} />,
              title: 'Calendar Integration',
              description:
                'Google Calendar events created automatically for both patients and doctors.',
              color: '#ef4444',
            },
            {
              icon: <Shield size={28} />,
              title: 'Role-Based Access',
              description:
                'Separate portals for patients, doctors, and admins with secure authentication.',
              color: '#10b981',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-card animate-fade-in"
              style={{
                padding: '32px',
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'backwards',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: `${feature.color}15`,
                  border: `1px solid ${feature.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  color: feature.color,
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: 'var(--text-primary)',
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '32px 48px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px',
        }}
      >
        <p>© 2024 HealthCare+ — AI-Powered Healthcare Appointment Manager</p>
      </footer>
    </div>
  );
}
