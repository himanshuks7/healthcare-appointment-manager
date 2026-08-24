import { google, calendar_v3 } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Generates the Google OAuth authorization URL
 */
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
  });
}

/**
 * Exchanges auth code for tokens
 */
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Creates a calendar event for an appointment
 */
export async function createCalendarEvent(
  accessToken: string,
  data: {
    summary: string;
    description: string;
    startTime: string;
    endTime: string;
    attendeeEmail?: string;
  }
): Promise<string | null> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event: calendar_v3.Schema$Event = {
      summary: data.summary,
      description: data.description,
      start: {
        dateTime: data.startTime,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: data.endTime,
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    if (data.attendeeEmail) {
      event.attendees = [{ email: data.attendeeEmail }];
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return null;
  }
}

/**
 * Updates an existing calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  data: {
    summary?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
  }
): Promise<boolean> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event: calendar_v3.Schema$Event = {};
    if (data.summary) event.summary = data.summary;
    if (data.description) event.description = data.description;
    if (data.startTime) {
      event.start = { dateTime: data.startTime, timeZone: 'Asia/Kolkata' };
    }
    if (data.endTime) {
      event.end = { dateTime: data.endTime, timeZone: 'Asia/Kolkata' };
    }

    await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });

    return true;
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    return false;
  }
}

/**
 * Deletes a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return true;
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
    return false;
  }
}
