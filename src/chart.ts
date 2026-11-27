export type Mark = {
  name: string;
  az: number;
  alt: number;
  kind: 'moon' | 'planet' | 'star';
};

const CX = 110;
const CY = 110;
const R = 84;

export function skyDome(marks: Mark[]): string {
  const rings = [30, 60]
    .map((alt) => {
      const rr = ((90 - alt) / 90) * R;
      return `<circle class="ring" cx="${CX}" cy="${CY}" r="${rr.toFixed(1)}" />`;
    })
    .join('');

  const dots = marks
    .filter((m) => m.alt > 0 && m.alt <= 90)
    .map((m) => dot(m))
    .join('');

  return `<svg viewBox="0 0 220 220" role="img" aria-label="Sky dome, north at the top">
    <circle class="ring horizon" cx="${CX}" cy="${CY}" r="${R}" />
    ${rings}
    <line class="ring" x1="${CX}" y1="${CY - R}" x2="${CX}" y2="${CY + R}" />
    <line class="ring" x1="${CX - R}" y1="${CY}" x2="${CX + R}" y2="${CY}" />
    <text class="card" x="${CX}" y="14" text-anchor="middle">N</text>
    <text class="card" x="208" y="${CY + 4}" text-anchor="end">E</text>
    <text class="card" x="${CX}" y="214" text-anchor="middle">S</text>
    <text class="card" x="12" y="${CY + 4}">W</text>
    ${dots}
  </svg>`;
}

function dot(mark: Mark): string {
  const rad = (mark.az * Math.PI) / 180;
  const rr = ((90 - mark.alt) / 90) * R;
  const x = CX + rr * Math.sin(rad);
  const y = CY - rr * Math.cos(rad);
  const radius = mark.kind === 'moon' ? 3.3 : mark.kind === 'planet' ? 2.5 : 1.6;
  // Keep the name inside the dome, just beside the dot.
  const east = Math.sin(rad) >= 0;
  const inward = rr > R - 22;
  const lx = inward ? x - Math.sin(rad) * 11 : x + (east ? 6 : -6);
  const ly = inward ? y + Math.cos(rad) * 11 + 3 : y + 3;
  const anchor = inward ? 'middle' : east ? 'start' : 'end';
  return `<g class="${mark.kind}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" /><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}">${esc(mark.name)}</text></g>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
}
