import type { Address, Gender } from './types';

export function formatAge(ageYears: number | null): string {
  if (ageYears == null) return '—';
  return `${ageYears}y`;
}

export function formatGender(gender: Gender): string {
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Single-line address in the Nepal order: tole, ward, municipality, district, province. */
export function formatAddress(a: Address | null | undefined): string {
  if (!a) return '';
  const ward = a.wardNo ? `Ward ${a.wardNo}` : null;
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
