import type { Address, Gender } from './types';
import { getLocale, LOCALE_TAG, translate } from '@/i18n';
import { getDetailedAge } from '@/lib/nepaliDate';

export function formatAge(ageYears: number | null, dateOfBirth?: string | null): string {
  if (dateOfBirth) {
    const detailed = getDetailedAge(dateOfBirth);
    if (detailed && detailed.years < 2) {
      return detailed.formatted;
    }
  }
  if (ageYears == null) return '—';
  return translate(getLocale(), '{age}y', { age: ageYears });
}

export function formatPreciseAge(
  dateOfBirth: string | null | undefined,
  ageYears: number | null | undefined,
  isMinor?: boolean,
): string {
  const locale = getLocale();
  if (dateOfBirth) {
    const detailed = getDetailedAge(dateOfBirth);
    if (detailed && detailed.years < 2) {
      return `${detailed.formatted} (${translate(locale, 'pediatric')})`;
    }
  }
  if (ageYears != null) {
    return isMinor
      ? translate(locale, '{age} years (minor)', { age: ageYears })
      : translate(locale, '{age} years', { age: ageYears });
  }
  return '—';
}

export function formatGender(gender: Gender): string {
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

/**
 * Dates follow the language the screen is in: month names in Nepali when Nepali is showing. The
 * digits stay Latin in both — a date on screen is read against a printed form or a sample label,
 * and those are never in Devanagari numerals.
 */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(LOCALE_TAG[getLocale()], { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(LOCALE_TAG[getLocale()], {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Single-line address in the Nepal order: tole, ward, municipality, district, province. */
export function formatAddress(a: Address | null | undefined): string {
  if (!a) return '';
  const ward = a.wardNo ? `${translate(getLocale(), 'Ward')} ${a.wardNo}` : null;
  return [a.line, a.tole, ward, a.municipality ?? a.city, a.district, a.province, a.country]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(', ');
}

/** Digits only, kept to the last 10 — matches the backend normalisation. */
export function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}
