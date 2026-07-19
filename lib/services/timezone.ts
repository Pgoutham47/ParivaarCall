// All scheduling and day-bucketing math uses this zone, not the server's local
// clock, so a deploy on a UTC host still works on the parent's wall-clock day.
export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Kolkata";

// en-CA formats as YYYY-MM-DD.
const dateKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const offsetProbeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

export function localDateKey(date = new Date()) {
  return dateKeyFormat.format(date);
}

function timeZoneOffsetMs(instant: Date) {
  const parts = Object.fromEntries(offsetProbeFormat.formatToParts(instant).map((part) => [part.type, part.value]));
  // hour12: false can emit "24" for midnight in some ICU versions.
  const wallClockAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );

  return wallClockAsUtc - instant.getTime();
}

// Converts a wall-clock date and time in APP_TIMEZONE to the UTC instant.
export function zonedDateTimeToUtc(dateKey: string, time: string) {
  const wallClock = new Date(`${dateKey}T${time}Z`);

  return new Date(wallClock.getTime() - timeZoneOffsetMs(wallClock));
}

export function startOfLocalDay(date = new Date()) {
  return zonedDateTimeToUtc(localDateKey(date), "00:00:00");
}

export function endOfLocalDay(date = new Date()) {
  return new Date(startOfLocalDay(date).getTime() + 24 * 60 * 60 * 1000);
}

export function daysAgo(days: number, from = new Date()) {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}
