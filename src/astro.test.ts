import { Body, DefineStar, Observer, SearchRiseSet } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { moonPhase, nightOf, riseSet, starRiseSet, twilight } from './astro';
import { formatTime, zonedToUtc } from './zone';

// London: 51°30'26" N, 0°07'39" W. Rise/set from a Meeus-based almanac (stjerneskinn.com), UT.
const LONDON = { lat: 51 + 30 / 60 + 26 / 3600, lon: -(7 / 60 + 39 / 3600), zone: 'Europe/London' };

// USNO rise/set table for 40.7915 N, 73.9761 W, zone 5h west of Greenwich. December is standard time.
const NYC = { lat: 40.7915, lon: -73.9761, zone: 'America/New_York' };

function minutesFrom(iso: string, actual: Date | null): number {
  if (!actual) throw new Error(`no time for ${iso}`);
  return Math.abs(actual.getTime() - Date.parse(iso)) / 60_000;
}

function angleDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

describe('sun', () => {
  it('matches sunrise and sunset at Greenwich on the June solstice', () => {
    const start = new Date('2024-06-21T00:00:00Z');
    expect(minutesFrom('2024-06-21T03:43:00Z', riseSet(Body.Sun, LONDON.lat, LONDON.lon, start, 1))).toBeLessThanOrEqual(2);
    expect(minutesFrom('2024-06-21T20:21:00Z', riseSet(Body.Sun, LONDON.lat, LONDON.lon, start, -1))).toBeLessThanOrEqual(2);
  });

  it('matches civil twilight at Greenwich that night', () => {
    const noon = new Date('2024-06-21T12:00:00Z');
    expect(minutesFrom('2024-06-21T21:09:00Z', twilight(LONDON.lat, LONDON.lon, noon, -1, -6))).toBeLessThanOrEqual(3);
    expect(minutesFrom('2024-06-22T02:55:00Z', twilight(LONDON.lat, LONDON.lon, noon, 1, -6))).toBeLessThanOrEqual(3);
    expect(minutesFrom('2024-06-21T22:24:00Z', twilight(LONDON.lat, LONDON.lon, noon, -1, -12))).toBeLessThanOrEqual(3);
  });

  it('uses the local evening for the night of a date', () => {
    const night = nightOf(LONDON, '2024-06-21', new Date('2024-06-21T12:00:00Z'));
    expect(minutesFrom('2024-06-21T20:21:00Z', night.sun.sunset)).toBeLessThanOrEqual(2);
    expect(minutesFrom('2024-06-22T03:43:00Z', night.sun.sunrise)).toBeLessThanOrEqual(2);
    expect(minutesFrom('2024-06-21T21:09:00Z', night.sun.civilDusk)).toBeLessThanOrEqual(3);
  });

  it('matches the USNO sun table for New York on the December solstice', () => {
    const night = nightOf(NYC, '2024-12-21', new Date('2024-12-21T18:00:00Z'));
    // 16:32 EST and, next morning, 07:17 EST.
    expect(minutesFrom('2024-12-21T21:32:00Z', night.sun.sunset)).toBeLessThanOrEqual(2);
    expect(minutesFrom('2024-12-22T12:17:00Z', night.sun.sunrise)).toBeLessThanOrEqual(2);
  });
});

describe('moon', () => {
  it('matches moonrise and moonset in London around full moon', () => {
    const start = new Date('2024-03-25T12:00:00Z');
    expect(minutesFrom('2024-03-25T18:46:00Z', riseSet(Body.Moon, LONDON.lat, LONDON.lon, start, 1))).toBeLessThanOrEqual(3);
    expect(minutesFrom('2024-03-26T06:10:00Z', riseSet(Body.Moon, LONDON.lat, LONDON.lon, start, -1))).toBeLessThanOrEqual(3);
  });

  it('matches published quarter phases', () => {
    // Fred Espenak, Phases of the Moon, Universal Time, minute-rounded.
    const cases = [
      ['2024-04-08T18:21:00Z', 0, 'new'],
      ['2024-04-15T19:13:00Z', 90, 'first quarter'],
      ['2024-03-25T07:00:00Z', 180, 'full'],
      ['2024-05-01T11:27:00Z', 270, 'last quarter'],
    ] as const;
    for (const [iso, target, name] of cases) {
      const phase = moonPhase(new Date(iso));
      expect(angleDelta(phase.angle, target)).toBeLessThanOrEqual(1.5);
      expect(phase.name).toBe(name);
    }
    expect(moonPhase(new Date('2024-03-25T07:00:00Z')).illuminated).toBeGreaterThan(0.98);
    expect(moonPhase(new Date('2024-04-08T18:21:00Z')).illuminated).toBeLessThan(0.02);
  });
});

describe('stars', () => {
  it('agrees with astronomy-engine on a Sirius rise', () => {
    DefineStar(Body.Star1, 6.7522, -16.72, 8.6);
    const obs = new Observer(LONDON.lat, LONDON.lon, 0);
    const start = new Date('2024-01-15T16:00:00Z');
    const library = SearchRiseSet(Body.Star1, obs, 1, start, 1);
    const ours = starRiseSet(6.7522, -16.72, LONDON.lat, LONDON.lon, start);
    expect(library).not.toBeNull();
    expect(minutesFrom(library!.date.toISOString(), ours.rise)).toBeLessThanOrEqual(4);
  });
});

describe('zones', () => {
  it('applies British Summer Time', () => {
    expect(zonedToUtc(2024, 6, 21, 21, 21, 'Europe/London').toISOString()).toBe('2024-06-21T20:21:00.000Z');
  });

  it('applies Eastern Standard Time', () => {
    expect(zonedToUtc(2024, 12, 21, 16, 32, 'America/New_York').toISOString()).toBe('2024-12-21T21:32:00.000Z');
  });

  it('formats a fixed offset in 12-hour clock', () => {
    expect(formatTime(new Date('2024-12-21T20:40:00Z'), 'fixed:0')).toBe('8:40 pm');
  });
});
