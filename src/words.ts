import type { When } from './astro';

const COMPASS = [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest',
] as const;

export function compass(azimuth: number): string {
  const a = ((azimuth % 360) + 360) % 360;
  return COMPASS[Math.round(a / 45) % 8];
}

export function where(altitude: number, azimuth: number): string {
  if (altitude >= 70) return 'overhead';
  const dir = compass(azimuth);
  if (altitude < 15) return `low in the ${dir}`;
  if (altitude < 40) return `in the ${dir}`;
  return `high in the ${dir}`;
}

export function phrase(
  sight: { altitude: number; azimuth: number; when: When; rise: Date | null; set: Date | null },
  format: (date: Date) => string,
): string {
  const place = where(sight.altitude, sight.azimuth);
  if (sight.when === 'rises' && sight.rise) return `${place} after ${format(sight.rise)}`;
  if (sight.when === 'set' && sight.set) return `set ${format(sight.set)}, was ${place}`;
  if (sight.when === 'up' && sight.set) return `${place}, sets ${format(sight.set)}`;
  return place;
}
