import { describe, expect, it } from 'vitest';
import {
  adToBs,
  bsToAd,
  calculateAgeFromDob,
  formatBsDate,
  getDetailedAge,
  parseBsDate,
} from './nepaliDate';

describe('nepaliDate utility', () => {
  it('converts epoch anchor correctly', () => {
    const bs = adToBs('1913-04-13');
    expect(bs).toEqual({
      year: 1970,
      month: 1,
      day: 1,
      formatted: '1970-01-01',
    });

    const ad = bsToAd(1970, 1, 1);
    expect(ad?.formatted).toBe('1913-04-13');
  });

  it('converts known Nepali New Year dates (2080 and 2081 BS)', () => {
    const bs2080 = adToBs('2023-04-14');
    expect(bs2080?.formatted).toBe('2080-01-01');

    const ad2080 = bsToAd(2080, 1, 1);
    expect(ad2080?.formatted).toBe('2023-04-14');

    const bs2081 = adToBs('2024-04-13');
    expect(bs2081?.formatted).toBe('2081-01-01');

    const ad2081 = bsToAd(2081, 1, 1);
    expect(ad2081?.formatted).toBe('2024-04-13');
  });

  it('performs flawless roundtrip conversions for multiple historical and modern dates', () => {
    const dates = [
      '1950-01-01',
      '1975-06-15',
      '1980-08-20',
      '1995-12-31',
      '2000-01-01',
      '2015-04-25',
      '2023-04-14',
      '2024-04-13',
      '2026-11-21',
    ];

    for (const adStr of dates) {
      const bs = adToBs(adStr);
      expect(bs).not.toBeNull();
      if (bs) {
        const backToAd = bsToAd(bs.year, bs.month, bs.day);
        expect(backToAd?.formatted).toBe(adStr);
      }
    }

    // Also test arbitrary BS dates roundtripping to AD and back to BS
    const bsDates = [
      { year: 1970, month: 1, day: 1 },
      { year: 2000, month: 5, day: 15 },
      { year: 2045, month: 8, day: 20 },
      { year: 2080, month: 1, day: 1 },
      { year: 2083, month: 8, day: 6 },
    ];

    for (const bs of bsDates) {
      const ad = bsToAd(bs.year, bs.month, bs.day);
      expect(ad).not.toBeNull();
      if (ad) {
        const backToBs = adToBs(ad.formatted);
        expect(backToBs?.year).toBe(bs.year);
        expect(backToBs?.month).toBe(bs.month);
        expect(backToBs?.day).toBe(bs.day);
      }
    }
  });

  it('calculates age correctly from DOB', () => {
    const ref = new Date(2026, 10, 21); // Nov 21, 2026
    expect(calculateAgeFromDob('1990-05-15', ref)).toBe(36);
    expect(calculateAgeFromDob('1990-11-20', ref)).toBe(36);
    expect(calculateAgeFromDob('1990-11-22', ref)).toBe(35); // birthday hasn't occurred yet this year
    expect(calculateAgeFromDob('2026-11-21', ref)).toBe(0);
    expect(calculateAgeFromDob('', ref)).toBeNull();
  });

  it('calculates detailed pediatric age correctly for neonates and infants', () => {
    const ref = new Date(2026, 10, 22); // Nov 22, 2026
    const neonate = getDetailedAge('2026-11-12', ref);
    expect(neonate?.years).toBe(0);
    expect(neonate?.months).toBe(0);
    expect(neonate?.days).toBe(10);
    expect(neonate?.formatted).toBe('10 days');

    const infant = getDetailedAge('2026-08-10', ref);
    expect(infant?.years).toBe(0);
    expect(infant?.months).toBe(3);
    expect(infant?.days).toBe(12);
    expect(infant?.formatted).toBe('3m 12d');

    const toddler = getDetailedAge('2025-06-15', ref);
    expect(toddler?.years).toBe(1);
    expect(toddler?.months).toBe(5);
    expect(toddler?.formatted).toBe('1y 5m');

    const adult = getDetailedAge('1990-05-15', ref);
    expect(adult?.years).toBe(36);
    expect(adult?.formatted).toBe('36y');
  });

  it('formats BS date string with month names in en and ne', () => {
    expect(formatBsDate('2050-04-15', 'en')).toBe('15 Shrawan 2050 BS');
    expect(formatBsDate('2050-04-15', 'ne')).toBe('15 श्रावण 2050 BS');
  });

  it('parses BS date string correctly', () => {
    expect(parseBsDate('2050-04-15')).toEqual({ year: 2050, month: 4, day: 15 });
    expect(parseBsDate('2050/04/15')).toEqual({ year: 2050, month: 4, day: 15 });
    expect(parseBsDate('invalid')).toBeNull();
  });
});
