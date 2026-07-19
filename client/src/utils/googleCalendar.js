/**
 * Builds a Google Calendar "TEMPLATE" URL so the user only needs to click Save.
 *
 * Notes:
 * - If no time is provided, we create an all-day event.
 * - If time is provided, we create a timed event with a default 60-minute duration.
 */
export function generateGoogleCalendarUrl(event) {
  const {
    title,
    description,
    location,
    appointmentDate,
    eventDate,
    appointmentTime,
    time,
    durationMinutes = 60,
  } = event || {};

  const dateValue = appointmentDate ?? eventDate;
  if (!dateValue) return 'https://calendar.google.com/calendar/render?action=TEMPLATE';

  const start = buildStartDate(dateValue, appointmentTime ?? time);
  const end = buildEndDate(start, appointmentTime ?? time, durationMinutes);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: cleanString(title) || 'Event',
  });

  if (appointmentTime ?? time) {
    params.set('dates', `${formatGoogleDateTime(start)}/${formatGoogleDateTime(end)}`);
  } else {
    // all-day uses dates=YYYYMMDD/YYYYMMDD (end is exclusive)
    const startDay = formatGoogleDay(start);
    const endDayExclusive = formatGoogleDay(addDays(start, 1));
    params.set('dates', `${startDay}/${endDayExclusive}`);
  }

  const details = cleanString(description);
  const where = cleanString(location);
  if (details) params.set('details', details);
  if (where) params.set('location', where);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function cleanString(value) {
  if (value === undefined || value === null) return '';
  const s = String(value).trim();
  return s;
}

function buildStartDate(dateValue, timeValue) {
  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) return new Date();

  if (!timeValue) {
    // all-day: normalize to local midnight
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0);
  }

  const parsed = parseTimeToHoursMinutes(String(timeValue));
  if (!parsed) {
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0);
  }

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    parsed.hours,
    parsed.minutes,
    0,
  );
}

function buildEndDate(startDate, timeValue, durationMinutes) {
  const end = new Date(startDate);
  if (!timeValue) return end;

  const minutes = Number.isFinite(Number(durationMinutes)) ? Number(durationMinutes) : 60;
  end.setMinutes(end.getMinutes() + Math.max(1, minutes));
  return end;
}

function parseTimeToHoursMinutes(raw) {
  const s = raw.trim();

  // HH:mm (24h)
  const m24 = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m24) return { hours: Number(m24[1]), minutes: Number(m24[2]) };

  // h:mm AM/PM
  const m12 = s.match(/^([1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (m12) {
    let hours = Number(m12[1]);
    const minutes = Number(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }

  return null;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Floating local time (no trailing Z) to avoid timezone shifts.
function formatGoogleDateTime(d) {
  return (
    d.getFullYear() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    'T' +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    '00'
  );
}

function formatGoogleDay(d) {
  return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
