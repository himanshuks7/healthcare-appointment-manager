# 🏥 HealthCare+ — Smart Appointment & Follow-up Manager

An AI-powered healthcare appointment platform with separate portals for patients, doctors, and administrators. Features intelligent symptom analysis, automated scheduling, post-visit summaries, email notifications, and Google Calendar integration.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748) ![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4)

---

## 🚀 Features

### Patient Portal
- Register, login, and manage your profile
- Search doctors by specialisation
- Book appointments with real-time slot availability
- Fill symptom forms before appointments
- View AI-generated pre-visit and post-visit summaries
- Receive medication reminders
- Cancel/reschedule appointments

### Doctor Portal
- View daily schedule with AI-powered patient summaries
- See urgency levels (LOW/MEDIUM/HIGH) for each appointment
- Access AI-generated suggested questions before consultations
- Submit post-visit notes and prescriptions
- Auto-generate patient-friendly summaries from clinical notes

### Admin Portal
- Create and manage doctor profiles (specialisation, hours, slot duration)
- Manage doctor leave days with automatic patient notification
- Overview dashboard with platform statistics
- View all appointments across the system

### AI & Automation
- **Pre-visit**: LLM analyses symptoms → urgency level, chief complaint, suggested questions
- **Post-visit**: LLM converts clinical notes → patient-friendly summary, medication schedule, follow-up steps
- Background jobs for medication reminders, email retry, and slot hold cleanup
- Graceful LLM failure handling with intelligent fallbacks

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite (Prisma ORM) — swappable to PostgreSQL |
| Auth | NextAuth.js v4 (JWT + Credentials) |
| AI/LLM | Google Gemini API |
| Email | Nodemailer (SMTP) |
| Calendar | Google Calendar API (OAuth 2.0) |
| Styling | Tailwind CSS v4 + Custom CSS |
| UI Icons | Lucide React |

---

## 📦 Setup Guide

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Healthcare
npm install
```

### 2. Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

**Required variables:**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

**Optional (for full functionality):**
```env
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"     # AI summaries
SMTP_HOST="smtp.ethereal.email"                  # Email notifications
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
GOOGLE_CLIENT_ID="your-google-client-id"         # Calendar integration
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Database Setup

```bash
npx prisma db push        # Create/sync database
npx tsx prisma/seed.ts     # Seed with demo data
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@healthcare.com | password123 |
| Doctor | dr.sharma@healthcare.com | password123 |
| Doctor | dr.patel@healthcare.com | password123 |
| Patient | patient1@example.com | password123 |

---

## 📊 Database Schema

```
User (id, email, password, name, phone, role)
  ├── DoctorProfile (specialisation, qualification, workingHours, slotDuration)
  │     ├── DoctorLeave (leaveDate, reason)
  │     └── Appointment (slotStart, slotEnd, status, version, holdExpiresAt)
  └── Appointment (as patient)
        ├── symptoms, preVisitSummary, urgencyLevel
        ├── postVisitNotes, prescription, postVisitSummary
        ├── calendarEventIds
        └── MedicationReminder (medication, dosage, frequency, nextReminderAt)

EmailLog (to, subject, body, status, retryCount, error)
```

---

## 🤖 LLM Prompts

### Pre-Visit Summary
```
"You are a medical triage assistant. Analyse these patient-reported symptoms 
and return a JSON response with:
1. urgencyLevel: "LOW" | "MEDIUM" | "HIGH"
2. chiefComplaint: one-line summary
3. suggestedQuestions: array of 3 questions for the doctor
4. briefSummary: 2-3 sentence clinical summary

Symptoms: <patient_symptoms>"
```

### Post-Visit Summary
```
"Convert these clinical notes into a patient-friendly summary with:
1. whatWasFound: plain-language diagnosis
2. medicationSchedule: array of {medication, dosage, frequency, duration}
3. followUpSteps: numbered list
4. warningSignsToWatch: bullet list

Clinical Notes: <notes>  Prescription: <prescription>"
```

---

## 🔌 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new patient |
| POST | `/api/auth/[...nextauth]` | NextAuth sign in/out |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List doctors (filter by specialisation) |
| GET | `/api/doctors/[id]/slots?date=YYYY-MM-DD` | Get available slots |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List user's appointments |
| POST | `/api/appointments` | Book new appointment |
| GET | `/api/appointments/[id]` | Get appointment details |
| PUT | `/api/appointments/[id]` | Cancel or complete appointment |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET/POST | `/api/admin/doctors` | List/create doctors |
| GET/PUT/DELETE | `/api/admin/doctors/[id]` | Manage doctor |
| POST/DELETE | `/api/admin/doctors/[id]/leave` | Manage leave |

### Background Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cron` | Run all background jobs |

---

## 📅 Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the **Google Calendar API**
4. Create OAuth 2.0 credentials (Web application)
5. Set redirect URI to `http://localhost:3000/api/auth/google/callback`
6. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

---

## 🚀 Deployment (Vercel)

```bash
npm install -g vercel
vercel login
vercel
```

Set environment variables in Vercel dashboard. The `vercel.json` includes a cron job that runs `/api/cron` every 5 minutes.

---

## 📝 License

MIT
