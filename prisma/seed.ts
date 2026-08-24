import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.emailLog.deleteMany();
  await prisma.medicationReminder.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

  // ─── Create Admin ────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@healthcare.com',
      password: passwordHash,
      name: 'System Admin',
      phone: '+1-555-0100',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // ─── Create Doctors ──────────────────────────────────────────────────────
  const doctorsData = [
    {
      email: 'dr.sharma@healthcare.com',
      name: 'Dr. Priya Sharma',
      phone: '+1-555-0201',
      specialisation: 'Cardiology',
      qualification: 'MD, DM Cardiology',
      bio: 'Senior Cardiologist with 15 years of experience in interventional cardiology and heart failure management.',
      slotDurationMinutes: 30,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      workingDays: '1,2,3,4,5',
    },
    {
      email: 'dr.patel@healthcare.com',
      name: 'Dr. Rajesh Patel',
      phone: '+1-555-0202',
      specialisation: 'Orthopedics',
      qualification: 'MS Orthopedics, Fellowship in Joint Replacement',
      bio: 'Specialist in joint replacement surgery and sports medicine with expertise in minimally invasive procedures.',
      slotDurationMinutes: 30,
      workingHoursStart: '10:00',
      workingHoursEnd: '18:00',
      workingDays: '1,2,3,4,5,6',
    },
    {
      email: 'dr.gupta@healthcare.com',
      name: 'Dr. Anita Gupta',
      phone: '+1-555-0203',
      specialisation: 'Dermatology',
      qualification: 'MD Dermatology, DNB',
      bio: 'Expert in cosmetic dermatology, skin cancer screening, and treatment of chronic skin conditions.',
      slotDurationMinutes: 20,
      workingHoursStart: '09:00',
      workingHoursEnd: '16:00',
      workingDays: '1,2,3,4,5',
    },
    {
      email: 'dr.kumar@healthcare.com',
      name: 'Dr. Vikram Kumar',
      phone: '+1-555-0204',
      specialisation: 'General Medicine',
      qualification: 'MD Internal Medicine',
      bio: 'General physician with focus on preventive care, diabetes management, and comprehensive health check-ups.',
      slotDurationMinutes: 20,
      workingHoursStart: '08:00',
      workingHoursEnd: '15:00',
      workingDays: '1,2,3,4,5,6',
    },
    {
      email: 'dr.singh@healthcare.com',
      name: 'Dr. Meera Singh',
      phone: '+1-555-0205',
      specialisation: 'Pediatrics',
      qualification: 'MD Pediatrics, Fellowship in Neonatology',
      bio: 'Pediatrician specializing in newborn care, childhood immunizations, and developmental assessments.',
      slotDurationMinutes: 30,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      workingDays: '1,2,3,4,5',
    },
  ];

  for (const doc of doctorsData) {
    const { specialisation, qualification, bio, slotDurationMinutes, workingHoursStart, workingHoursEnd, workingDays, ...userData } = doc;
    
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: passwordHash,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialisation,
            qualification,
            bio,
            slotDurationMinutes,
            workingHoursStart,
            workingHoursEnd,
            workingDays,
            isActive: true,
          },
        },
      },
      include: { doctorProfile: true },
    });
    console.log(`✅ Doctor created: ${user.name} (${specialisation})`);
  }

  // ─── Create Sample Patients ──────────────────────────────────────────────
  const patientsData = [
    { email: 'patient1@example.com', name: 'Arjun Mehta', phone: '+1-555-0301' },
    { email: 'patient2@example.com', name: 'Sneha Reddy', phone: '+1-555-0302' },
    { email: 'patient3@example.com', name: 'Rahul Verma', phone: '+1-555-0303' },
  ];

  for (const patient of patientsData) {
    const user = await prisma.user.create({
      data: {
        ...patient,
        password: passwordHash,
        role: 'PATIENT',
      },
    });
    console.log(`✅ Patient created: ${user.name}`);
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials (all accounts use password: password123):');
  console.log('   Admin:   admin@healthcare.com');
  console.log('   Doctor:  dr.sharma@healthcare.com');
  console.log('   Patient: patient1@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
