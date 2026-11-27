export type ZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function isFixedZone(zone: string): boolean {
  return zone.startsWith('fixed:');
}

function offsetMinutes(zone: string): number {
  return Number(zone.slice('fixed:'.length));
}

export function zoneParts(date: Date, zone: string): ZoneParts {
  if (isFixedZone(zone)) {
    const shifted = new Date(date.getTime() + offsetMinutes(zone) * 60_000);
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: shifted.getUTCHours(),
      minute: shifted.getUTCMinutes(),
      second: shifted.getUTCSeconds(),
    };
  }

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts: Partial<ZoneParts> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type === 'year') parts.year = Number(part.value);
    else if (part.type === 'month') parts.month = Number(part.value);
    else if (part.type === 'day') parts.day = Number(part.value);
    else if (part.type === 'hour') parts.hour = Number(part.value);
    else if (part.type === 'minute') parts.minute = Number(part.value);
    else if (part.type === 'second') parts.second = Number(part.value);
  }
  // A few engines report midnight as 24:00.
  if (parts.hour === 24) parts.hour = 0;
  return parts as ZoneParts;
}

export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  zone: string,
): Date {
  if (isFixedZone(zone)) {
    return new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes(zone) * 60_000);
  }
  // The offset depends on the instant, because of daylight saving, so correct a UTC guess.
  let utc = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 3; i++) {
    const p = zoneParts(new Date(utc), zone);
    const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utc;
    const next = Date.UTC(year, month - 1, day, hour, minute) - offset;
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}

export function localDateString(date: Date, zone: string): string {
  const p = zoneParts(date, zone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  const mo = String(t.getUTCMonth() + 1).padStart(2, '0');
  const day = String(t.getUTCDate()).padStart(2, '0');
  return `${t.getUTCFullYear()}-${mo}-${day}`;
}

export function atLocal(iso: string, hour: number, minute: number, zone: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return zonedToUtc(y, m, d, hour, minute, zone);
}

export function formatTime(date: Date, zone: string): string {
  const { hour, minute } = zoneParts(date, zone);
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function formatLongDate(iso: string, zone: string): string {
  const noon = atLocal(iso, 12, 0, zone);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: isFixedZone(zone) ? 'UTC' : zone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(isFixedZone(zone) ? shiftFixed(noon, zone) : noon);
}

function shiftFixed(date: Date, zone: string): Date {
  return new Date(date.getTime() + offsetMinutes(zone) * 60_000);
}

/** Nearest whole-hour meridian. A named city carries the civil zone, including daylight saving. */
export function meridianZone(longitude: number): string {
  const hours = Math.max(-12, Math.min(12, Math.round(longitude / 15)));
  return `fixed:${hours * 60}`;
}
