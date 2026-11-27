import { nightOf, observingDate, type Night, type Sight } from './astro';
import { skyDome, type Mark } from './chart';
import {
  cityLabel,
  formatCoord,
  nearestCity,
  parseCoords,
  placeFromCoords,
  searchCities,
  type City,
  type Place,
} from './place';
import { phrase } from './words';
import { formatLongDate, formatTime } from './zone';

const KEY = 'night-sky-tonight';

const placeInput = q<HTMLInputElement>('#place');
const dateInput = q<HTMLInputElement>('#date');
const suggest = q<HTMLUListElement>('#suggest');
const report = q<HTMLElement>('#report');
const status = q<HTMLElement>('#status');
const coords = q<HTMLElement>('#coords');
const dayname = q<HTMLElement>('#dayname');
const redBtn = q<HTMLButtonElement>('#red');

let place: Place | null = null;
let dateISO = '';
let dateTouched = false;
let red = false;
let matches: City[] = [];
let hi = 0;

const saved = load();
red = saved.red;
place = saved.place;
applyRed(red);
if (place) {
  placeInput.value = place.name;
  dateISO = observingDate(place);
  dateInput.value = dateISO;
  renderReport();
} else {
  status.textContent = 'Choose a place.';
}

q<HTMLFormElement>('#where').addEventListener('submit', (e) => e.preventDefault());

placeInput.addEventListener('input', () => {
  matches = parseCoords(placeInput.value) ? [] : searchCities(placeInput.value);
  hi = 0;
  renderMatches();
});

placeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    matches = [];
    renderMatches();
    return;
  }
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && matches.length) {
    e.preventDefault();
    hi = e.key === 'ArrowDown' ? (hi + 1) % matches.length : (hi + matches.length - 1) % matches.length;
    renderMatches();
    return;
  }
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const parsed = parseCoords(placeInput.value);
  if (parsed) {
    usePlace(placeFromCoords(parsed.lat, parsed.lon));
    return;
  }
  const city = matches[hi];
  if (city) {
    usePlace(fromCity(city));
    return;
  }
  status.textContent = 'No match. Try a large city, or coordinates like 40.7, -74.';
});

placeInput.addEventListener('blur', () => {
  matches = [];
  renderMatches();
});

suggest.addEventListener('mousedown', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  e.preventDefault();
  const city = matches[Number(btn.dataset.i)];
  if (city) usePlace(fromCity(city));
});

q('#geo').addEventListener('click', () => {
  if (!navigator.geolocation) {
    status.textContent = 'This browser has no location.';
    return;
  }
  status.textContent = 'Asking for location.';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const near = nearestCity(lat, lon);
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      usePlace({ name: near ? cityLabel(near) : formatCoord(lat, lon), lat, lon, zone });
    },
    () => {
      status.textContent = 'Location permission was denied.';
    },
    { timeout: 12000, maximumAge: 5 * 60_000 },
  );
});

dateInput.addEventListener('change', () => {
  if (!dateInput.value) return;
  dateTouched = true;
  dateISO = dateInput.value;
  renderReport();
});

q('#tonight').addEventListener('click', () => {
  if (!place) return;
  dateTouched = false;
  dateISO = observingDate(place);
  dateInput.value = dateISO;
  renderReport();
});

redBtn.addEventListener('click', () => {
  applyRed(!red);
  save();
});

function usePlace(next: Place) {
  place = next;
  placeInput.value = next.name;
  matches = [];
  renderMatches();
  if (!dateTouched) {
    dateISO = observingDate(next);
    dateInput.value = dateISO;
  }
  save();
  renderReport();
}

function renderReport() {
  const here = place;
  if (!here || !dateISO) {
    report.innerHTML = '';
    coords.textContent = '';
    dayname.textContent = '';
    status.textContent = 'Choose a place.';
    return;
  }
  let night: Night;
  try {
    night = nightOf(here, dateISO);
  } catch {
    status.textContent = 'Could not compute that date.';
    report.innerHTML = '';
    return;
  }
  status.textContent = '';
  coords.textContent = formatCoord(here.lat, here.lon);
  const fmt = (d: Date) => formatTime(d, here.zone);
  const when = night.chartTime ? ` · sky at ${fmt(night.chartTime)}` : '';
  dayname.textContent = `${formatLongDate(dateISO, here.zone)}${when}`;
  report.innerHTML = renderNight(night, fmt);
}

function renderNight(night: Night, fmt: (d: Date) => string): string {
  const parts = [`<h2>Sun</h2>`, ...sunLines(night, fmt).map((line) => `<p>${esc(line)}</p>`), `<h2>Moon</h2>`, ...moonLines(night, fmt)];
  if (night.chartTime) {
    parts.push(planetBlock(night.planets, fmt));
    parts.push(starBlock(night.stars, fmt));
    parts.push(chartBlock(night, fmt));
  }
  return parts.join('');
}

function sunLines(night: Night, fmt: (d: Date) => string): string[] {
  const s = night.sun;
  if (s.polar === 'day') return ['does not set'];
  const lines: string[] = [];
  if (s.sunset) lines.push(`sets ${fmt(s.sunset)}`);
  else if (!s.sunrise) lines.push(s.polar === 'night' ? 'does not rise' : 'stays below the horizon');
  if (s.civilDusk) lines.push(`civil twilight ends ${fmt(s.civilDusk)}`);
  if (s.nauticalDusk) lines.push(`nautical twilight ends ${fmt(s.nauticalDusk)}`);
  if (s.nauticalDawn) lines.push(`nautical twilight begins ${fmt(s.nauticalDawn)}`);
  if (s.civilDawn) lines.push(`civil twilight begins ${fmt(s.civilDawn)}`);
  if (s.sunrise) lines.push(`rises ${fmt(s.sunrise)}`);
  if (s.shallow) lines.push('no full darkness');
  return lines;
}

function moonLines(night: Night, fmt: (d: Date) => string): string[] {
  const m = night.moon;
  const lines = [`<p>${esc(m.phase)}, ${Math.round(m.illuminated * 100)}% lit</p>`];
  if (m.rise) lines.push(`<p>rises ${esc(fmt(m.rise))}</p>`);
  if (m.set) lines.push(`<p>sets ${esc(fmt(m.set))}</p>`);
  if (m.sight) lines.push(`<p>${esc(phrase(m.sight, fmt))}</p>`);
  else if (night.darkStart) lines.push('<p>not up</p>');
  return lines;
}

function planetBlock(planets: Sight[], fmt: (d: Date) => string): string {
  const up = planets.filter((p) => p.visible && p.when !== 'rises');
  const later = planets
    .filter((p) => p.visible && p.when === 'rises')
    .sort((a, b) => (a.rise?.getTime() ?? 0) - (b.rise?.getTime() ?? 0));
  const lines = [...up, ...later].map((p) => sightLine(p.name, p, fmt));
  const hidden = planets.filter((p) => !p.visible).map((p) => p.name);
  if (hidden.length) lines.push(`<p class="dim">not up: ${esc(hidden.join(', '))}</p>`);
  return `<h2>Planets</h2>${lines.join('')}`;
}

function starBlock(stars: Sight[], fmt: (d: Date) => string): string {
  if (!stars.length) return '<h2>Stars</h2><p class="dim">none well placed</p>';
  const lines = stars.map((s) => {
    const name = `<span class="name">${esc(s.name)}</span> <span class="const">${esc(s.constellation ?? '')}</span>`;
    return `<p>${name}: ${esc(phrase(s, fmt))}</p>`;
  });
  return `<h2>Stars</h2>${lines.join('')}`;
}

function chartBlock(night: Night, fmt: (d: Date) => string): string {
  if (!night.chartTime) return '';
  const marks: Mark[] = [];
  if (night.moon.sight?.onChart) {
    marks.push({ name: 'Moon', az: night.moon.sight.azimuth, alt: night.moon.sight.altitude, kind: 'moon' });
  }
  for (const p of night.planets) {
    if (p.onChart) marks.push({ name: p.name, az: p.azimuth, alt: p.altitude, kind: 'planet' });
  }
  for (const s of night.stars) {
    if (s.onChart) marks.push({ name: chartName(s.name), az: s.azimuth, alt: s.altitude, kind: 'star' });
  }
  const caption = `${fmt(night.chartTime)}. North at the top, rings at 30° and 60°.`;
  return `<h2>Sky</h2><figure>${skyDome(marks)}<figcaption>${esc(caption)}</figcaption></figure>`;
}

function chartName(name: string): string {
  if (name === 'Alpha Centauri') return 'α Cen';
  return name;
}

function sightLine(name: string, sight: Sight, fmt: (d: Date) => string): string {
  return `<p><span class="name">${esc(name)}</span>: ${esc(phrase(sight, fmt))}</p>`;
}

function renderMatches() {
  if (!matches.length) {
    suggest.hidden = true;
    suggest.innerHTML = '';
    return;
  }
  suggest.hidden = false;
  suggest.innerHTML = matches
    .map(
      (c, i) =>
        `<li><button type="button" data-i="${i}" aria-selected="${i === hi ? 'true' : 'false'}">${esc(cityLabel(c))}</button></li>`,
    )
    .join('');
}

function fromCity(city: City): Place {
  return { name: cityLabel(city), lat: city.lat, lon: city.lon, zone: city.zone };
}

function applyRed(on: boolean) {
  red = on;
  document.documentElement.classList.toggle('red', on);
  redBtn.textContent = on ? 'white' : 'red';
  redBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', on ? '#180a0a' : '#131210');
}

function load(): { place: Place | null; red: boolean } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Place> & { red?: boolean };
    const on = Boolean(raw.red);
    if (typeof raw.lat === 'number' && typeof raw.lon === 'number' && raw.zone && raw.name) {
      return { place: { name: raw.name, lat: raw.lat, lon: raw.lon, zone: raw.zone }, red: on };
    }
    return { place: null, red: on };
  } catch {
    return { place: null, red: false };
  }
}

function save() {
  const body = place ? { ...place, red } : { red };
  localStorage.setItem(KEY, JSON.stringify(body));
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
}

function q<T extends Element>(sel: string): T {
  const node = document.querySelector<T>(sel);
  if (!node) throw new Error(sel);
  return node;
}
