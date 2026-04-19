import { addMinutes } from "date-fns";
import { google, type calendar_v3 } from "googleapis";

const IST = "Asia/Kolkata";
const SLOT_MINUTES = 30;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const MAX_FREE_SLOTS = 5;
const MAX_SCAN_DAYS = 45;

type BusyInterval = { startMs: number; endMs: number };

function istYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function addCalendarDaysIst(istYmd: string, deltaDays: number): string {
  const anchor = new Date(`${istYmd}T12:00:00+05:30`);
  const shifted = addMinutes(anchor, deltaDays * 24 * 60);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
}

function istSlotStartUtc(istYmd: string, hour: number, minute: number): Date {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${istYmd}T${hh}:${mm}:00+05:30`);
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function slotOverlapsBusy(
  slotStartMs: number,
  slotEndMs: number,
  busy: BusyInterval[],
): boolean {
  return busy.some((b) =>
    rangesOverlap(slotStartMs, slotEndMs, b.startMs, b.endMs),
  );
}

function formatSlotDisplay(slotStart: Date, now: Date): string {
  const slotDay = istYmd(slotStart);
  const today = istYmd(now);
  const tomorrow = addCalendarDaysIst(today, 1);
  const timePart = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(slotStart);

  if (slotDay === tomorrow) {
    return `Tomorrow, ${timePart}`;
  }
  if (slotDay === today) {
    return `Today, ${timePart}`;
  }
  const datePart = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(slotStart);
  return `${datePart}, ${timePart}`;
}

function parseServiceAccount(): {
  client_email: string;
  private_key: string;
} {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  }
  try {
    const parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("Service account JSON must include client_email and private_key");
    }
    const privateKey = parsed.private_key.replace(/\\n/g, "\n");
    return { client_email: parsed.client_email, private_key: privateKey };
  } catch (err) {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", err);
    throw new Error(
      `Invalid GOOGLE_SERVICE_ACCOUNT_JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  const creds = parseServiceAccount();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  await auth.authorize();
  return google.calendar({ version: "v3", auth });
}

function eventToBusyIntervals(
  event: calendar_v3.Schema$Event,
): BusyInterval[] {
  const start = event.start;
  const end = event.end;
  if (!start || !end) {
    return [];
  }

  if (start.dateTime && end.dateTime) {
    const s = new Date(start.dateTime).getTime();
    const e = new Date(end.dateTime).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) {
      return [];
    }
    return [{ startMs: s, endMs: e }];
  }

  if (start.date && end.date) {
    const dayStart = new Date(`${start.date}T00:00:00+05:30`).getTime();
    const dayEnd = new Date(`${end.date}T00:00:00+05:30`).getTime();
    if (Number.isNaN(dayStart) || Number.isNaN(dayEnd) || dayEnd <= dayStart) {
      return [];
    }
    return [{ startMs: dayStart, endMs: dayEnd }];
  }

  return [];
}

/**
 * Lists up to **five** upcoming **30-minute** consultation gaps on the clinic calendar during **09:00–18:00 IST**,
 * skipping times that overlap existing events. Search begins on `preferredDate` (YYYY-MM-DD, IST calendar day) or **tomorrow IST**.
 *
 * @throws Error if required env vars are missing, credentials are invalid, or the Google Calendar API request fails.
 */
export async function getAvailableSlots(
  preferredDate?: string,
): Promise<
  Array<{ start: string; end: string; display: string }>
> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID");
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (preferredDate && !datePattern.test(preferredDate)) {
    throw new Error(
      "preferredDate must be YYYY-MM-DD when provided",
    );
  }

  try {
    const calendar = await getCalendarClient();
    const now = new Date();
    const todayIst = istYmd(now);
    const startIstDay =
      preferredDate && datePattern.test(preferredDate)
        ? preferredDate
        : addCalendarDaysIst(todayIst, 1);

    const rangeStart = new Date(`${startIstDay}T00:00:00+05:30`);
    const scanEndDay = addCalendarDaysIst(startIstDay, MAX_SCAN_DAYS);
    const rangeEnd = new Date(`${scanEndDay}T23:59:59.999+05:30`);

    const busy: BusyInterval[] = [];
    let pageToken: string | undefined;

    do {
      const res = await calendar.events.list({
        calendarId,
        timeMin: rangeStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        showDeleted: false,
        maxResults: 2500,
        pageToken,
      });

      const items = res.data.items ?? [];
      for (const ev of items) {
        busy.push(...eventToBusyIntervals(ev));
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);

    busy.sort((a, b) => a.startMs - b.startMs);

    const slots: Array<{ start: string; end: string; display: string }> = [];

    outer: for (let dayOffset = 0; dayOffset <= MAX_SCAN_DAYS; dayOffset += 1) {
      const istDay = addCalendarDaysIst(startIstDay, dayOffset);

      for (
        let minutesFromMidnight = WORK_START_HOUR * 60;
        minutesFromMidnight < WORK_END_HOUR * 60;
        minutesFromMidnight += SLOT_MINUTES
      ) {
        const hour = Math.floor(minutesFromMidnight / 60);
        const minute = minutesFromMidnight % 60;
        const slotStart = istSlotStartUtc(istDay, hour, minute);
        const slotEnd = addMinutes(slotStart, SLOT_MINUTES);

        if (slotEnd.getTime() > new Date(`${istDay}T${String(WORK_END_HOUR).padStart(2, "0")}:00:00+05:30`).getTime()) {
          continue;
        }

        if (slotStart.getTime() < now.getTime()) {
          continue;
        }

        const slotStartMs = slotStart.getTime();
        const slotEndMs = slotEnd.getTime();

        if (slotOverlapsBusy(slotStartMs, slotEndMs, busy)) {
          continue;
        }

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          display: formatSlotDisplay(slotStart, now),
        });

        if (slots.length >= MAX_FREE_SLOTS) {
          break outer;
        }
      }
    }

    return slots;
  } catch (err) {
    console.error("getAvailableSlots failed:", err);
    throw new Error(
      `getAvailableSlots: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Creates a **Google Calendar** event for a booked consultation and returns the new event’s ID.
 *
 * @throws Error when env configuration is invalid or the Calendar API insert call fails.
 */
export async function createCalendarEvent(params: {
  patientName: string;
  patientPhone: string;
  slotStart: string;
  slotEnd: string;
  concernSummary: string;
  clinicName: string;
}): Promise<{ eventId: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID");
  }

  try {
    const calendar = await getCalendarClient();
    const startDate = new Date(params.slotStart);
    const endDate = new Date(params.slotEnd);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error("Invalid slotStart or slotEnd ISO datetime");
    }

    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Dermatology visit - ${params.patientName}`,
        description: `Patient: ${params.patientName}\nPhone: ${params.patientPhone}\n\nReason for visit / notes:\n${params.concernSummary}\n\nClinic: ${params.clinicName}`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: IST,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: IST,
        },
      },
    });

    const id = res.data.id;
    if (!id) {
      console.error("Google Calendar insert returned no id:", res.data);
      throw new Error("Google Calendar did not return an event id");
    }

    return { eventId: id };
  } catch (err) {
    console.error("createCalendarEvent failed:", err);
    throw new Error(
      `createCalendarEvent: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
