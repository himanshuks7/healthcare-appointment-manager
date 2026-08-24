# System Design — Healthcare Appointment & Follow-up Manager

## Architecture Overview

The system follows a **three-tier architecture** built entirely on Next.js 14 with the App Router, using Prisma ORM for data access and SQLite (swappable to PostgreSQL) for persistence. Authentication is handled via NextAuth.js with JWT-based sessions carrying role information (PATIENT, DOCTOR, ADMIN). The frontend uses React Server Components where possible and Client Components for interactive elements.

## Double-Booking Prevention (Multi-Layer Strategy)

Preventing double-booking in a concurrent environment requires defence in depth. Our system uses **six complementary layers**:

**Layer 1 — UI Optimism**: When a patient views available slots, already-booked and past slots are filtered out. The slot grid reflects real-time availability fetched from the server, reducing the chance a user even attempts to book an occupied slot.

**Layer 2 — Temporary Slot Hold**: When a patient selects a slot and proceeds to the symptom form, the system creates a `PENDING` appointment with a `holdExpiresAt` timestamp set to 5 minutes in the future. This acts as a soft reservation — no other patient can book the same slot while the hold is active. If the patient abandons the flow, the hold expires automatically.

**Layer 3 — Optimistic Locking via Version Field**: Every appointment carries a `version` integer. When confirming a held appointment, the system checks `WHERE id = ? AND version = ? AND holdExpiresAt > NOW()`. If another process modified the record (incrementing the version), the update affects zero rows and returns a conflict error. This prevents race conditions between the hold-creation and confirmation steps.

**Layer 4 — Database Unique Constraint**: A composite unique index on `(doctorId, slotStart, status)` at the database level prevents identical appointments from being inserted, even if application-level checks are bypassed.

**Layer 5 — Transaction Isolation**: All slot-hold and confirmation operations execute within database transactions, ensuring atomicity. A failed step rolls back the entire operation.

**Layer 6 — Expired Hold Cleanup**: A background job (cron endpoint at `/api/cron`) runs every 5 minutes and deletes `PENDING` appointments whose `holdExpiresAt` has passed. This ensures abandoned holds don't permanently block slots.

## Doctor Leave Conflict Handling

When an admin marks a doctor on leave for a specific date, the system immediately queries for all `CONFIRMED` or `PENDING` appointments on that date for the affected doctor. Each is automatically cancelled: the appointment status is set to `CANCELLED`, and an email notification is dispatched to the patient explaining the cancellation and inviting them to rebook. The leave date is stored in the `DoctorLeave` table with a unique constraint on `(doctorId, leaveDate)` to prevent duplicate entries. The slot generation service checks leave days before returning availability, so no new bookings can be made on leave dates.

## Slot Hold Mechanism

The slot hold is the bridge between "selecting a slot" and "confirming an appointment." Without it, two patients could select the same slot simultaneously and both proceed to the symptom form, only for one to fail at confirmation. The 5-minute window balances two concerns: it must be long enough for a patient to complete the symptom form (typically 2–3 minutes) but short enough to avoid blocking popular slots unnecessarily.

Implementation details:
- Hold is created via `POST /api/appointments` with `holdExpiresAt = NOW() + 5min`
- Confirmation via the same endpoint checks the hold hasn't expired
- If confirmation fails (hold expired or version mismatch), the patient receives a clear error and can retry with a fresh slot selection
- The cleanup cron deletes stale holds, maintaining database hygiene

## Notification Failure Handling

Email delivery is inherently unreliable. Our strategy:

1. **Logging First**: Every email attempt is logged to the `EmailLog` table with status `PENDING` before sending. This creates an audit trail regardless of SMTP outcome.

2. **Immediate Error Capture**: If `nodemailer.sendMail()` throws, the log entry is updated to `FAILED` with the error message, and `retryCount` is incremented.

3. **Retry Queue**: The background cron job queries for `FAILED` emails with `retryCount < 3` and reattempts delivery. Each retry increments the counter. After 3 failures, the email is considered permanently failed.

4. **Non-Blocking Design**: Email sending is fire-and-forget (using `.catch(console.error)`) — the booking confirmation returns to the user immediately, even if the email fails. The user can always view their appointment in the portal.

5. **Graceful Degradation**: If the SMTP server is unreachable, the appointment workflow still succeeds. Emails are a notification layer, not a gatekeeping mechanism.

## LLM Integration & Failure Handling

The system uses Google Gemini for two AI features: pre-visit symptom analysis and post-visit patient-friendly summaries. Both use structured JSON prompts with explicit output format instructions.

**Failure Handling**: LLM calls use exponential backoff (1s, 3s, 5s) with up to 3 retries. If all retries fail, a deterministic fallback generates a basic summary using keyword matching (e.g., "chest pain" → HIGH urgency). The appointment is never blocked by LLM failure — the summary field is simply populated with the fallback. The doctor sees either the AI summary or the patient's raw symptoms. If no API key is configured, the system operates entirely on fallback logic, making it functional without any external AI service.

## Database Design Rationale

The schema uses 6 models with intentional denormalization for performance. Urgency level is stored directly on the `Appointment` table (rather than only in the JSON `preVisitSummary`) to enable efficient filtering and dashboard queries. Calendar event IDs are stored per-appointment for O(1) lookup during cancellation. The `EmailLog` table is separated from the appointment workflow to prevent email issues from impacting core operations. Indexes are placed on frequently queried fields: `(doctorId, slotStart)` for slot availability checks, `(patientId)` for patient dashboards, and `(status, retryCount)` for the email retry queue.
