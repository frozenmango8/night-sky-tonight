import { meridianZone } from './zone';

export type City = {
  name: string;
  region: string;
  lat: number;
  lon: number;
  zone: string;
};

export type Place = {
  name: string;
  lat: number;
  lon: number;
  zone: string;
};

// Enough large cities to answer "what about Tokyo" without sending the query anywhere.
const RAW: [string, string, number, number, string][] = [
  ['London', 'UK', 51.507, -0.128, 'Europe/London'],
  ['Edinburgh', 'UK', 55.953, -3.189, 'Europe/London'],
  ['Glasgow', 'UK', 55.861, -4.25, 'Europe/London'],
  ['Manchester', 'UK', 53.481, -2.242, 'Europe/London'],
  ['Birmingham', 'UK', 52.486, -1.89, 'Europe/London'],
  ['Cardiff', 'UK', 51.481, -3.179, 'Europe/London'],
  ['Belfast', 'UK', 54.598, -5.93, 'Europe/London'],
  ['Dublin', 'Ireland', 53.35, -6.26, 'Europe/Dublin'],
  ['Paris', 'France', 48.857, 2.352, 'Europe/Paris'],
  ['Lyon', 'France', 45.764, 4.836, 'Europe/Paris'],
  ['Marseille', 'France', 43.297, 5.381, 'Europe/Paris'],
  ['Brussels', 'Belgium', 50.847, 4.357, 'Europe/Brussels'],
  ['Amsterdam', 'Netherlands', 52.367, 4.904, 'Europe/Amsterdam'],
  ['Berlin', 'Germany', 52.52, 13.405, 'Europe/Berlin'],
  ['Munich', 'Germany', 48.137, 11.575, 'Europe/Berlin'],
  ['Hamburg', 'Germany', 53.551, 9.994, 'Europe/Berlin'],
  ['Zurich', 'Switzerland', 47.377, 8.541, 'Europe/Zurich'],
  ['Geneva', 'Switzerland', 46.204, 6.143, 'Europe/Zurich'],
  ['Vienna', 'Austria', 48.208, 16.373, 'Europe/Vienna'],
  ['Prague', 'Czechia', 50.075, 14.438, 'Europe/Prague'],
  ['Warsaw', 'Poland', 52.23, 21.012, 'Europe/Warsaw'],
  ['Budapest', 'Hungary', 47.498, 19.04, 'Europe/Budapest'],
  ['Madrid', 'Spain', 40.417, -3.704, 'Europe/Madrid'],
  ['Barcelona', 'Spain', 41.387, 2.168, 'Europe/Madrid'],
  ['Lisbon', 'Portugal', 38.722, -9.139, 'Europe/Lisbon'],
  ['Rome', 'Italy', 41.903, 12.496, 'Europe/Rome'],
  ['Milan', 'Italy', 45.464, 9.19, 'Europe/Rome'],
  ['Athens', 'Greece', 37.984, 23.728, 'Europe/Athens'],
  ['Istanbul', 'Turkey', 41.008, 28.978, 'Europe/Istanbul'],
  ['Moscow', 'Russia', 55.756, 37.617, 'Europe/Moscow'],
  ['Stockholm', 'Sweden', 59.329, 18.069, 'Europe/Stockholm'],
  ['Oslo', 'Norway', 59.913, 10.752, 'Europe/Oslo'],
  ['Tromso', 'Norway', 69.649, 18.956, 'Europe/Oslo'],
  ['Copenhagen', 'Denmark', 55.676, 12.568, 'Europe/Copenhagen'],
  ['Helsinki', 'Finland', 60.17, 24.938, 'Europe/Helsinki'],
  ['Reykjavik', 'Iceland', 64.147, -21.942, 'Atlantic/Reykjavik'],
  ['Ponta Delgada', 'Azores', 37.741, -25.676, 'Atlantic/Azores'],
  ['Las Palmas', 'Spain', 28.124, -15.43, 'Atlantic/Canary'],
  ['New York', 'US', 40.713, -74.006, 'America/New_York'],
  ['Boston', 'US', 42.36, -71.059, 'America/New_York'],
  ['Philadelphia', 'US', 39.953, -75.164, 'America/New_York'],
  ['Washington', 'US', 38.907, -77.037, 'America/New_York'],
  ['Miami', 'US', 25.762, -80.192, 'America/New_York'],
  ['Atlanta', 'US', 33.749, -84.388, 'America/New_York'],
  ['Detroit', 'US', 42.331, -83.046, 'America/Detroit'],
  ['Chicago', 'US', 41.878, -87.63, 'America/Chicago'],
  ['Minneapolis', 'US', 44.978, -93.265, 'America/Chicago'],
  ['Houston', 'US', 29.76, -95.37, 'America/Chicago'],
  ['Dallas', 'US', 32.777, -96.797, 'America/Chicago'],
  ['Austin', 'US', 30.267, -97.743, 'America/Chicago'],
  ['New Orleans', 'US', 29.951, -90.072, 'America/Chicago'],
  ['Denver', 'US', 39.739, -104.99, 'America/Denver'],
  ['Salt Lake City', 'US', 40.761, -111.891, 'America/Denver'],
  ['Albuquerque', 'US', 35.084, -106.651, 'America/Denver'],
  ['Phoenix', 'US', 33.449, -112.074, 'America/Phoenix'],
  ['Las Vegas', 'US', 36.17, -115.14, 'America/Los_Angeles'],
  ['Los Angeles', 'US', 34.052, -118.244, 'America/Los_Angeles'],
  ['San Diego', 'US', 32.716, -117.161, 'America/Los_Angeles'],
  ['San Francisco', 'US', 37.775, -122.419, 'America/Los_Angeles'],
  ['Portland', 'US', 45.515, -122.678, 'America/Los_Angeles'],
  ['Seattle', 'US', 47.606, -122.332, 'America/Los_Angeles'],
  ['Anchorage', 'US', 61.218, -149.9, 'America/Anchorage'],
  ['Honolulu', 'US', 21.307, -157.858, 'Pacific/Honolulu'],
  ['Birmingham', 'US', 33.519, -86.81, 'America/Chicago'],
  ['Toronto', 'Canada', 43.653, -79.383, 'America/Toronto'],
  ['Ottawa', 'Canada', 45.421, -75.697, 'America/Toronto'],
  ['Montreal', 'Canada', 45.502, -73.567, 'America/Toronto'],
  ['Halifax', 'Canada', 44.649, -63.575, 'America/Halifax'],
  ['Winnipeg', 'Canada', 49.895, -97.138, 'America/Winnipeg'],
  ['Calgary', 'Canada', 51.045, -114.071, 'America/Edmonton'],
  ['Edmonton', 'Canada', 53.546, -113.494, 'America/Edmonton'],
  ['Vancouver', 'Canada', 49.283, -123.121, 'America/Vancouver'],
  ['St John\'s', 'Canada', 47.561, -52.713, 'America/St_Johns'],
  ['Mexico City', 'Mexico', 19.433, -99.133, 'America/Mexico_City'],
  ['Bogota', 'Colombia', 4.711, -74.072, 'America/Bogota'],
  ['Quito', 'Ecuador', -0.18, -78.468, 'America/Guayaquil'],
  ['Lima', 'Peru', -12.046, -77.043, 'America/Lima'],
  ['La Paz', 'Bolivia', -16.5, -68.15, 'America/La_Paz'],
  ['Santiago', 'Chile', -33.449, -70.669, 'America/Santiago'],
  ['Buenos Aires', 'Argentina', -34.604, -58.382, 'America/Argentina/Buenos_Aires'],
  ['Ushuaia', 'Argentina', -54.802, -68.303, 'America/Argentina/Ushuaia'],
  ['Montevideo', 'Uruguay', -34.901, -56.164, 'America/Montevideo'],
  ['Sao Paulo', 'Brazil', -23.551, -46.633, 'America/Sao_Paulo'],
  ['Rio de Janeiro', 'Brazil', -22.907, -43.173, 'America/Sao_Paulo'],
  ['Casablanca', 'Morocco', 33.573, -7.59, 'Africa/Casablanca'],
  ['Marrakesh', 'Morocco', 31.63, -7.981, 'Africa/Casablanca'],
  ['Cairo', 'Egypt', 30.044, 31.236, 'Africa/Cairo'],
  ['Lagos', 'Nigeria', 6.524, 3.379, 'Africa/Lagos'],
  ['Nairobi', 'Kenya', -1.292, 36.822, 'Africa/Nairobi'],
  ['Johannesburg', 'South Africa', -26.204, 28.047, 'Africa/Johannesburg'],
  ['Cape Town', 'South Africa', -33.925, 18.424, 'Africa/Johannesburg'],
  ['Tel Aviv', 'Israel', 32.085, 34.782, 'Asia/Jerusalem'],
  ['Jerusalem', 'Israel', 31.768, 35.214, 'Asia/Jerusalem'],
  ['Dubai', 'UAE', 25.205, 55.271, 'Asia/Dubai'],
  ['Doha', 'Qatar', 25.286, 51.534, 'Asia/Qatar'],
  ['Riyadh', 'Saudi Arabia', 24.713, 46.675, 'Asia/Riyadh'],
  ['Tehran', 'Iran', 35.689, 51.389, 'Asia/Tehran'],
  ['Karachi', 'Pakistan', 24.861, 67.01, 'Asia/Karachi'],
  ['Delhi', 'India', 28.614, 77.209, 'Asia/Kolkata'],
  ['Mumbai', 'India', 19.076, 72.878, 'Asia/Kolkata'],
  ['Bangalore', 'India', 12.972, 77.595, 'Asia/Kolkata'],
  ['Kolkata', 'India', 22.573, 88.364, 'Asia/Kolkata'],
  ['Kathmandu', 'Nepal', 27.717, 85.324, 'Asia/Kathmandu'],
  ['Dhaka', 'Bangladesh', 23.811, 90.413, 'Asia/Dhaka'],
  ['Colombo', 'Sri Lanka', 6.927, 79.861, 'Asia/Colombo'],
  ['Bangkok', 'Thailand', 13.756, 100.502, 'Asia/Bangkok'],
  ['Singapore', 'Singapore', 1.352, 103.82, 'Asia/Singapore'],
  ['Kuala Lumpur', 'Malaysia', 3.139, 101.687, 'Asia/Kuala_Lumpur'],
  ['Jakarta', 'Indonesia', -6.208, 106.846, 'Asia/Jakarta'],
  ['Manila', 'Philippines', 14.599, 120.984, 'Asia/Manila'],
  ['Hong Kong', 'China', 22.319, 114.169, 'Asia/Hong_Kong'],
  ['Taipei', 'Taiwan', 25.033, 121.565, 'Asia/Taipei'],
  ['Shanghai', 'China', 31.23, 121.474, 'Asia/Shanghai'],
  ['Beijing', 'China', 39.904, 116.407, 'Asia/Shanghai'],
  ['Seoul', 'South Korea', 37.567, 126.978, 'Asia/Seoul'],
  ['Tokyo', 'Japan', 35.682, 139.76, 'Asia/Tokyo'],
  ['Osaka', 'Japan', 34.694, 135.502, 'Asia/Tokyo'],
  ['Sapporo', 'Japan', 43.062, 141.354, 'Asia/Tokyo'],
  ['Perth', 'Australia', -31.952, 115.861, 'Australia/Perth'],
  ['Darwin', 'Australia', -12.463, 130.846, 'Australia/Darwin'],
  ['Adelaide', 'Australia', -34.929, 138.6, 'Australia/Adelaide'],
  ['Melbourne', 'Australia', -37.814, 144.963, 'Australia/Melbourne'],
  ['Hobart', 'Australia', -42.883, 147.33, 'Australia/Hobart'],
  ['Sydney', 'Australia', -33.869, 151.209, 'Australia/Sydney'],
  ['Canberra', 'Australia', -35.283, 149.128, 'Australia/Sydney'],
  ['Brisbane', 'Australia', -27.47, 153.021, 'Australia/Brisbane'],
  ['Auckland', 'New Zealand', -36.851, 174.764, 'Pacific/Auckland'],
  ['Wellington', 'New Zealand', -41.287, 174.776, 'Pacific/Auckland'],
  ['Christchurch', 'New Zealand', -43.532, 172.637, 'Pacific/Auckland'],
  ['Suva', 'Fiji', -18.141, 178.441, 'Pacific/Fiji'],
  ['Papeete', 'Tahiti', -17.533, -149.567, 'Pacific/Tahiti'],
];

const CITIES: City[] = RAW.map(([name, region, lat, lon, zone]) => ({ name, region, lat, lon, zone }));

export function cityLabel(city: City): string {
  return `${city.name}, ${city.region}`;
}

export function searchCities(query: string): City[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits = CITIES.filter((c) => wordStarts(c.name, q) || wordStarts(cityLabel(c), q));
  hits.sort((a, b) => {
    const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.name.localeCompare(b.name) || a.region.localeCompare(b.region);
  });
  return hits.slice(0, 6);
}

export function nearestCity(lat: number, lon: number, withinKm = 45): City | null {
  let best: City | null = null;
  let bestKm = withinKm;
  for (const city of CITIES) {
    const d = haversine(lat, lon, city.lat, city.lon);
    if (d < bestKm) {
      best = city;
      bestKm = d;
    }
  }
  return best;
}

export function parseCoords(input: string): { lat: number; lon: number } | null {
  const s = input.trim().replace(/°/g, '');
  let m = s.match(/^([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)$/);
  if (m) return finite(+m[1], +m[2]);
  m = s.match(/^(\d+(?:\.\d+)?)\s*([ns])\s*[, ]?\s*(\d+(?:\.\d+)?)\s*([ew])$/i);
  if (!m) return null;
  const lat = +m[1] * (m[2].toLowerCase() === 's' ? -1 : 1);
  const lon = +m[3] * (m[4].toLowerCase() === 'w' ? -1 : 1);
  return finite(lat, lon);
}

export function formatCoord(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

export function placeFromCoords(lat: number, lon: number): Place {
  return { name: formatCoord(lat, lon), lat, lon, zone: meridianZone(lon) };
}

function wordStarts(hay: string, q: string): boolean {
  return hay.toLowerCase().split(/[^a-z0-9]+/).some((word) => word.startsWith(q));
}

function finite(lat: number, lon: number): { lat: number; lon: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}
