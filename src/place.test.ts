import { describe, expect, it } from 'vitest';
import { nearestCity, parseCoords, searchCities } from './place';

describe('parseCoords', () => {
  it('accepts decimal degrees and hemisphere letters', () => {
    expect(parseCoords('40.7, -74')).toEqual({ lat: 40.7, lon: -74 });
    expect(parseCoords('51.5 N 0.1 W')).toEqual({ lat: 51.5, lon: -0.1 });
    expect(parseCoords('33.9° S, 18.4° E')).toEqual({ lat: -33.9, lon: 18.4 });
  });

  it('rejects a city name and an impossible latitude', () => {
    expect(parseCoords('London')).toBeNull();
    expect(parseCoords('95, 10')).toBeNull();
  });
});

describe('cities', () => {
  it('finds a city by name without leaving the list', () => {
    const hits = searchCities('tokyo');
    expect(hits[0]?.name).toBe('Tokyo');
    expect(hits[0]?.zone).toBe('Asia/Tokyo');
  });

  it('keeps both Birminghams', () => {
    const names = searchCities('birmingham').map((c) => `${c.name}, ${c.region}`);
    expect(names).toContain('Birmingham, UK');
    expect(names).toContain('Birmingham, US');
  });

  it('names a nearby city and ignores a long way off', () => {
    expect(nearestCity(51.5, -0.12)?.name).toBe('London');
    expect(nearestCity(0, 0)).toBeNull();
  });
});
