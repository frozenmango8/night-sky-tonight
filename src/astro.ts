import {
  Body,
  Elongation,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  SearchAltitude,
  SearchRiseSet,
  SiderealTime,
} from 'astronomy-engine';
import { addDays, atLocal, localDateString } from './zone';

export type Where = {
  lat: number;
  lon: number;
  zone: string;
};

export type When = 'up' | 'rises' | 'set';

export type Sight = {
  name: string;
  kind: 'planet' | 'star' | 'moon';
  constellation?: string;
  visible: boolean;
  altitude: number;
  azimuth: number;
  when: When;
  rise: Date | null;
  set: Date | null;
  onChart: boolean;
};

export type SunInfo = {
  sunset: Date | null;
  sunrise: Date | null;
  civilDusk: Date | null;
  civilDawn: Date | null;
  nauticalDusk: Date | null;
  nauticalDawn: Date | null;
  /** Sun stays up, or stays down, for the whole date. */
  polar: 'day' | 'night' | null;
  /** Sets, but never reaches nautical dark. */
  shallow: boolean;
};

export type MoonInfo = {
  phase: string;
  illuminated: number;
  rise: Date | null;
  set: Date | null;
  sight: Sight | null;
};

export type Night = {
  sun: SunInfo;
  moon: MoonInfo;
  planets: Sight[];
  stars: Sight[];
  chartTime: Date | null;
  darkStart: Date | null;
  darkEnd: Date | null;
};

type AltAz = { alt: number; az: number };

const PLANETS: { body: Body; name: string }[] = [
  { body: Body.Mercury, name: 'Mercury' },
  { body: Body.Venus, name: 'Venus' },
  { body: Body.Mars, name: 'Mars' },
  { body: Body.Jupiter, name: 'Jupiter' },
  { body: Body.Saturn, name: 'Saturn' },
];

// J2000. Precession to the present is well under a degree, fine for a naked-eye direction.
const STARS: { name: string; constellation: string; ra: number; dec: number; mag: number }[] = [
  { name: 'Sirius', constellation: 'Canis Major', ra: 6.7522, dec: -16.72, mag: -1.46 },
  { name: 'Canopus', constellation: 'Carina', ra: 6.3992, dec: -52.7, mag: -0.74 },
  { name: 'Arcturus', constellation: 'Bootes', ra: 14.2611, dec: 19.18, mag: -0.05 },
  { name: 'Alpha Centauri', constellation: 'Centaurus', ra: 14.66, dec: -60.83, mag: -0.01 },
  { name: 'Vega', constellation: 'Lyra', ra: 18.6156, dec: 38.78, mag: 0.03 },
  { name: 'Capella', constellation: 'Auriga', ra: 5.2781, dec: 46.0, mag: 0.08 },
  { name: 'Rigel', constellation: 'Orion', ra: 5.2422, dec: -8.2, mag: 0.13 },
  { name: 'Procyon', constellation: 'Canis Minor', ra: 7.655, dec: 5.23, mag: 0.34 },
  { name: 'Achernar', constellation: 'Eridanus', ra: 1.6286, dec: -57.24, mag: 0.46 },
  { name: 'Betelgeuse', constellation: 'Orion', ra: 5.9194, dec: 7.41, mag: 0.5 },
  { name: 'Acrux', constellation: 'Crux', ra: 12.4433, dec: -63.1, mag: 0.76 },
  { name: 'Altair', constellation: 'Aquila', ra: 19.8464, dec: 8.87, mag: 0.77 },
  { name: 'Aldebaran', constellation: 'Taurus', ra: 4.5986, dec: 16.51, mag: 0.85 },
  { name: 'Antares', constellation: 'Scorpius', ra: 16.49, dec: -26.43, mag: 0.96 },
  { name: 'Spica', constellation: 'Virgo', ra: 13.42, dec: -11.16, mag: 0.97 },
  { name: 'Pollux', constellation: 'Gemini', ra: 7.7553, dec: 28.03, mag: 1.14 },
  { name: 'Fomalhaut', constellation: 'Piscis Austrinus', ra: 22.9608, dec: -29.62, mag: 1.16 },
  { name: 'Deneb', constellation: 'Cygnus', ra: 20.6906, dec: 45.28, mag: 1.25 },
  { name: 'Regulus', constellation: 'Leo', ra: 10.1394, dec: 11.97, mag: 1.36 },
];

const SIDEREAL_DAY_MS = 86_164.0905 * 1000;
const MS_PER_SIDEREAL_HOUR = SIDEREAL_DAY_MS / 24;

export function phaseName(angle: number): string {
  const a = ((angle % 360) + 360) % 360;
  if (a < 7 || a >= 353) return 'new';
  if (a < 83) return 'waxing crescent';
  if (a < 97) return 'first quarter';
  if (a < 173) return 'waxing gibbous';
  if (a < 187) return 'full';
  if (a < 263) return 'waning gibbous';
  if (a < 277) return 'last quarter';
  return 'waning crescent';
}

export function moonPhase(date: Date): { angle: number; illuminated: number; name: string } {
  const angle = MoonPhase(date);
  const illuminated = Illumination(Body.Moon, date).phase_fraction;
  return { angle, illuminated, name: phaseName(angle) };
}

export function riseSet(
  body: Body,
  lat: number,
  lon: number,
  start: Date,
  direction: 1 | -1,
  limitDays = 2,
): Date | null {
  const found = SearchRiseSet(body, new Observer(lat, lon, 0), direction, start, limitDays);
  return found ? found.date : null;
}

export function twilight(
  lat: number,
  lon: number,
  start: Date,
  direction: 1 | -1,
  altitude: number,
  limitDays = 2,
): Date | null {
  const found = SearchAltitude(Body.Sun, new Observer(lat, lon, 0), direction, start, limitDays, altitude);
  return found ? found.date : null;
}

/** Rise and set of a fixed star nearest to `around`. Null when it never crosses the horizon. */
export function starRiseSet(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  around: Date,
): { rise: Date | null; set: Date | null } {
  const ha = hourAngleHours(lat, dec);
  if (ha === 'up' || ha === 'down') return { rise: null, set: null };
  const transit = nearestTransit(ra, lon, around);
  const half = ha * MS_PER_SIDEREAL_HOUR;
  return {
    rise: new Date(transit.getTime() - half),
    set: new Date(transit.getTime() + half),
  };
}

/** Before this morning's sunrise, "tonight" is still yesterday's night. */
export function observingDate(where: Where, now = new Date()): string {
  const today = localDateString(now, where.zone);
  const midnight = atLocal(today, 0, 0, where.zone);
  const sunrise = riseSet(Body.Sun, where.lat, where.lon, midnight, 1, 0.6);
  const noon = atLocal(today, 12, 0, where.zone);
  if (sunrise && sunrise < noon && now < sunrise) return addDays(today, -1);
  return today;
}

export function nightOf(where: Where, date: string, now = new Date()): Night {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('bad date');
  const obs = new Observer(where.lat, where.lon, 0);
  const noon = atLocal(date, 12, 0, where.zone);
  const nextNoon = atLocal(addDays(date, 1), 12, 0, where.zone);
  const midnight = atLocal(date, 0, 0, where.zone);
  const nextMidnight = atLocal(addDays(date, 1), 0, 0, where.zone);

  // Search from local noon. At midnight the evening twilight has often already happened,
  // so a forward search would land on the following evening.
  const sunset = eventBetween(Body.Sun, obs, -1, noon, nextNoon);
  const sunrise = eventBetween(Body.Sun, obs, 1, noon, nextNoon);
  const civilDusk = eventBetween(Body.Sun, obs, -1, noon, nextNoon, -6);
  const nauticalDusk = eventBetween(Body.Sun, obs, -1, noon, nextNoon, -12);
  const civilDawn = eventBetween(Body.Sun, obs, 1, noon, nextNoon, -6);
  const nauticalDawn = eventBetween(Body.Sun, obs, 1, noon, nextNoon, -12);
  const noonAlt = horizontal(Body.Sun, noon, obs).alt;

  let darkStart: Date | null = null;
  let darkEnd: Date | null = null;
  let polar: SunInfo['polar'] = null;
  let shallow = false;

  if (civilDusk && civilDawn && civilDawn > civilDusk) {
    darkStart = civilDusk;
    darkEnd = civilDawn;
  } else if (sunset && sunrise && sunrise > sunset) {
    darkStart = sunset;
    darkEnd = sunrise;
    shallow = true;
  } else if (noonAlt <= -6) {
    darkStart = midnight;
    darkEnd = nextMidnight;
    polar = 'night';
  } else if (noonAlt > 0 && !sunset) {
    polar = 'day';
  }

  const sun: SunInfo = {
    sunset,
    sunrise,
    civilDusk,
    civilDawn,
    nauticalDusk,
    nauticalDawn,
    polar,
    shallow,
  };

  const chartTime = pickChartTime(now, darkStart, darkEnd);
  const phaseAt = chartTime ?? noon;

  if (!darkStart || !darkEnd || !chartTime) {
    return {
      sun,
      moon: moonInfo(phaseAt, null, null, null),
      planets: [],
      stars: [],
      chartTime: null,
      darkStart: null,
      darkEnd: null,
    };
  }

  const moonCross = crossings(Body.Moon, obs, darkStart, darkEnd);
  const moonSight = describe('Moon', 'moon', (t) => horizontal(Body.Moon, t, obs), moonCross, chartTime, darkStart, darkEnd);
  const moonTimes = timetable(moonCross, darkStart, darkEnd);
  const moon = moonInfo(phaseAt, moonTimes.rise, moonTimes.set, moonSight.visible ? moonSight : null);

  const planets = PLANETS.map(({ body, name }) => {
    const cross = crossings(body, obs, darkStart, darkEnd);
    const sight = describe(name, 'planet', (t) => horizontal(body, t, obs), cross, chartTime, darkStart, darkEnd);
    if (sight.visible && lostInGlare(body, sight)) {
      return { ...sight, visible: false, onChart: false };
    }
    return sight;
  });

  const stars = pickStars(where, obs, chartTime, darkStart, darkEnd);

  return {
    sun,
    moon,
    planets,
    stars,
    chartTime,
    darkStart,
    darkEnd,
  };
}

function moonInfo(date: Date, rise: Date | null, set: Date | null, sight: Sight | null): MoonInfo {
  const phase = moonPhase(date);
  return { phase: phase.name, illuminated: phase.illuminated, rise, set, sight };
}

function pickChartTime(now: Date, darkStart: Date | null, darkEnd: Date | null): Date | null {
  if (!darkStart || !darkEnd) return null;
  // The night of a date runs into the next morning, so `now` can fall inside it
  // even when the calendar day has already rolled over.
  if (now >= darkStart && now <= darkEnd) return now;
  const later = new Date(darkStart.getTime() + 60 * 60 * 1000);
  if (later < darkEnd) return later;
  return new Date((darkStart.getTime() + darkEnd.getTime()) / 2);
}

function eventBetween(
  body: Body,
  obs: Observer,
  direction: 1 | -1,
  start: Date,
  end: Date,
  altitude?: number,
): Date | null {
  const limitDays = (end.getTime() - start.getTime()) / 86_400_000;
  if (!(limitDays > 0)) return null;
  const found =
    altitude === undefined
      ? SearchRiseSet(body, obs, direction, start, limitDays)
      : SearchAltitude(body, obs, direction, start, limitDays, altitude);
  if (!found) return null;
  if (found.date < start || found.date >= end) return null;
  return found.date;
}

function horizontal(body: Body, date: Date, obs: Observer): AltAz {
  const eq = Equator(body, date, obs, true, true);
  const h = Horizon(date, obs, eq.ra, eq.dec, 'normal');
  return { alt: h.altitude, az: h.azimuth };
}

function starHorizontal(ra: number, dec: number, date: Date, obs: Observer): AltAz {
  const h = Horizon(date, obs, ra, dec, 'normal');
  return { alt: h.altitude, az: h.azimuth };
}

type Cross = {
  alt0: number;
  nextRise: Date | null;
  nextSet: Date | null;
  prevRise: Date | null;
};

function crossings(body: Body, obs: Observer, start: Date, end: Date): Cross {
  const span = (end.getTime() - start.getTime()) / 86_400_000 + 0.3;
  return {
    alt0: horizontal(body, start, obs).alt,
    nextRise: rawRiseSet(body, obs, 1, start, span),
    nextSet: rawRiseSet(body, obs, -1, start, span),
    prevRise: rawRiseSet(body, obs, 1, start, -1.5),
  };
}

function rawRiseSet(body: Body, obs: Observer, direction: 1 | -1, start: Date, limitDays: number): Date | null {
  const found = SearchRiseSet(body, obs, direction, start, limitDays);
  return found ? found.date : null;
}

function describe(
  name: string,
  kind: Sight['kind'],
  altAt: (t: Date) => AltAz,
  cross: Cross,
  chart: Date,
  darkStart: Date,
  darkEnd: Date,
  constellation?: string,
): Sight {
  const upAtStart = cross.alt0 > 0;
  const rise = !upAtStart && cross.nextRise && cross.nextRise < darkEnd ? cross.nextRise : null;
  const set =
    cross.nextSet && cross.nextSet > darkStart && cross.nextSet <= new Date(darkEnd.getTime() + 30 * 60_000)
      ? cross.nextSet
      : null;
  const visible = upAtStart || rise !== null;
  const atChart = altAt(chart);

  if (!visible) {
    return blank(name, kind, atChart, constellation);
  }

  if (atChart.alt > 0) {
    const setsLater = set && set > chart ? set : null;
    return {
      name,
      kind,
      constellation,
      visible: true,
      altitude: atChart.alt,
      azimuth: atChart.az,
      when: 'up',
      rise: null,
      set: setsLater,
      onChart: true,
    };
  }

  if (rise && rise > chart) {
    const at = altAt(new Date(Math.min(rise.getTime() + 40 * 60_000, darkEnd.getTime())));
    return {
      name,
      kind,
      constellation,
      visible: true,
      altitude: at.alt,
      azimuth: at.az,
      when: 'rises',
      rise,
      set: null,
      onChart: false,
    };
  }

  if (set && set <= chart) {
    const at = altAt(new Date(set.getTime() - 40 * 60_000));
    return {
      name,
      kind,
      constellation,
      visible: true,
      altitude: at.alt,
      azimuth: at.az,
      when: 'set',
      rise: null,
      set,
      onChart: false,
    };
  }

  return blank(name, kind, atChart, constellation);
}

function blank(name: string, kind: Sight['kind'], at: AltAz, constellation?: string): Sight {
  return {
    name,
    kind,
    constellation,
    visible: false,
    altitude: at.alt,
    azimuth: at.az,
    when: 'up',
    rise: null,
    set: null,
    onChart: false,
  };
}

function timetable(cross: Cross, darkStart: Date, darkEnd: Date): { rise: Date | null; set: Date | null } {
  const upAtStart = cross.alt0 > 0;
  const rise = upAtStart ? cross.prevRise : cross.nextRise;
  const set = cross.nextSet;
  const early = darkStart.getTime() - 26 * 60 * 60_000;
  const late = darkEnd.getTime() + 6 * 60 * 60_000;
  return {
    rise: rise && rise.getTime() >= early && rise.getTime() <= late ? rise : null,
    set: set && set.getTime() >= darkStart.getTime() - 6 * 60 * 60_000 && set.getTime() <= late ? set : null,
  };
}

function lostInGlare(body: Body, sight: Sight): boolean {
  const when = sight.rise ?? sight.set;
  if (!when) return false;
  return Elongation(body, when).elongation < 7;
}

function pickStars(where: Where, obs: Observer, chart: Date, darkStart: Date, darkEnd: Date): Sight[] {
  const ranked: { sight: Sight; mag: number; peak: number }[] = [];
  for (const star of STARS) {
    const altAt = (t: Date) => starHorizontal(star.ra, star.dec, t, obs);
    const cross = starCross(star.ra, star.dec, where.lat, where.lon, altAt, darkStart, darkEnd);
    const peak = peakAltitude(altAt, darkStart, darkEnd);
    if (peak < 12) continue;
    const sight = describe(star.name, 'star', altAt, cross, chart, darkStart, darkEnd, star.constellation);
    if (!sight.visible) continue;
    ranked.push({ sight, mag: star.mag, peak });
  }
  ranked.sort((a, b) => a.mag - b.mag);
  const bright = ranked.filter((s) => s.peak >= 18);
  const chosen = (bright.length >= 4 ? bright : ranked).slice(0, 8);
  return chosen.map((s) => s.sight);
}

function starCross(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  altAt: (t: Date) => AltAz,
  darkStart: Date,
  darkEnd: Date,
): Cross {
  const ha = hourAngleHours(lat, dec);
  const alt0 = altAt(darkStart).alt;
  if (ha === 'up') return { alt0, nextRise: null, nextSet: null, prevRise: null };
  if (ha === 'down') return { alt0: -90, nextRise: null, nextSet: null, prevRise: null };

  const mid = new Date((darkStart.getTime() + darkEnd.getTime()) / 2);
  let best: { rise: Date; set: Date; overlap: number } | null = null;
  const first = nearestTransit(ra, lon, mid);
  for (const shift of [-1, 0, 1]) {
    const transit = new Date(first.getTime() + shift * SIDEREAL_DAY_MS);
    const half = ha * MS_PER_SIDEREAL_HOUR;
    const rise = new Date(transit.getTime() - half);
    const set = new Date(transit.getTime() + half);
    const overlap = Math.min(set.getTime(), darkEnd.getTime()) - Math.max(rise.getTime(), darkStart.getTime());
    if (overlap > 0 && (!best || overlap > best.overlap)) best = { rise, set, overlap };
  }
  if (!best) return { alt0, nextRise: null, nextSet: null, prevRise: null };
  return {
    alt0,
    nextRise: best.rise >= new Date(darkStart.getTime() - 60_000) ? best.rise : null,
    nextSet: best.set > darkStart ? best.set : null,
    prevRise: best.rise < darkStart ? best.rise : null,
  };
}

function peakAltitude(altAt: (t: Date) => AltAz, start: Date, end: Date): number {
  let peak = -90;
  const step = 20 * 60_000;
  for (let t = start.getTime(); t <= end.getTime(); t += step) {
    peak = Math.max(peak, altAt(new Date(t)).alt);
  }
  return peak;
}

// Mean refraction at the horizon. Stars have no disc to add on top of that.
const HORIZON_REFRACTION = 0.5667;

function hourAngleHours(lat: number, dec: number): number | 'up' | 'down' {
  const latR = (lat * Math.PI) / 180;
  const decR = (dec * Math.PI) / 180;
  const cosLat = Math.cos(latR);
  if (Math.abs(cosLat) < 1e-6) {
    const alt = lat >= 0 ? dec : -dec;
    return alt > -HORIZON_REFRACTION ? 'up' : 'down';
  }
  const altR = (-HORIZON_REFRACTION * Math.PI) / 180;
  const cosH = (Math.sin(altR) - Math.sin(latR) * Math.sin(decR)) / (cosLat * Math.cos(decR));
  if (cosH <= -1) return 'up';
  if (cosH >= 1) return 'down';
  return ((Math.acos(cosH) * 180) / Math.PI) / 15;
}

function nearestTransit(raHours: number, lon: number, around: Date): Date {
  const gst = SiderealTime(around);
  const target = norm24(raHours - lon / 15);
  let delta = norm24(target - gst);
  if (delta > 12) delta -= 24;
  return new Date(around.getTime() + delta * MS_PER_SIDEREAL_HOUR);
}

function norm24(hours: number): number {
  return ((hours % 24) + 24) % 24;
}
