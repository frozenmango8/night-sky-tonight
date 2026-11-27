import { describe, expect, it } from 'vitest';
import { formatTime } from './zone';
import { phrase, where } from './words';

const fmt = (date: Date) => formatTime(date, 'fixed:0');

describe('where', () => {
  it('names height and compass point', () => {
    expect(where(8, 90)).toBe('low in the east');
    expect(where(25, 225)).toBe('in the southwest');
    expect(where(50, 180)).toBe('high in the south');
    expect(where(80, 10)).toBe('overhead');
    expect(where(12, 359)).toBe('low in the north');
  });
});

describe('phrase', () => {
  it('describes a rise later in the night', () => {
    const text = phrase(
      { altitude: 8, azimuth: 90, when: 'rises', rise: new Date('2024-12-21T20:40:00Z'), set: null },
      fmt,
    );
    expect(text).toBe('low in the east after 8:40 pm');
  });

  it('describes something already up', () => {
    const text = phrase(
      { altitude: 52, azimuth: 180, when: 'up', rise: null, set: new Date('2024-12-22T04:10:00Z') },
      fmt,
    );
    expect(text).toBe('high in the south, sets 4:10 am');
  });
});
