/**
 * Bidirectional Bikram Sambat (BS) <-> Gregorian (AD) calendar converter.
 *
 * Uses the exact authoritative 121-year lookup table (BS 1970-2090 / AD 1913-2034)
 * synchronized with backend `np.com.lims.common.calendar.BikramSambatCalendar`.
 */

export interface BsDate {
  year: number;
  month: number;
  day: number;
}

export const BS_YEAR_MIN = 1970;
export const BS_YEAR_MAX = 2090;

export const NEPALI_MONTHS = [
  { bsMonth: 1, en: 'Baisakh', ne: 'बैशाख' },
  { bsMonth: 2, en: 'Jestha', ne: 'जेठ' },
  { bsMonth: 3, en: 'Ashadh', ne: 'असार' },
  { bsMonth: 4, en: 'Shrawan', ne: 'श्रावण' },
  { bsMonth: 5, en: 'Bhadra', ne: 'भाद्र' },
  { bsMonth: 6, en: 'Ashwin', ne: 'असोज' },
  { bsMonth: 7, en: 'Kartik', ne: 'कार्तिक' },
  { bsMonth: 8, en: 'Mangsir', ne: 'मंसिर' },
  { bsMonth: 9, en: 'Poush', ne: 'पौष' },
  { bsMonth: 10, en: 'Magh', ne: 'माघ' },
  { bsMonth: 11, en: 'Falgun', ne: 'फाल्गुन' },
  { bsMonth: 12, en: 'Chaitra', ne: 'चैत्र' },
] as const;

/** [year - 1970][month 0-11] = days in that BS month. */
export const DAYS_IN_MONTH: readonly (readonly number[])[] = [
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1970
  [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30], // 1971
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 1972
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 1973
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1974
  [31, 31, 32, 32, 30, 31, 30, 29, 30, 29, 30, 30], // 1975
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 1976
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 1977
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1978
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 1979
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 1980
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30], // 1981
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1982
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 1983
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 1984
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30], // 1985
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1986
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 1987
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 1988
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 1989
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1990
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 1991
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 1992
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 1993
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1994
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 1995
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 1996
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1997
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 1998
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 1999
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2000
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2001
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2002
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2003
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2004
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2005
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2006
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2007
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31], // 2008
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2009
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2010
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2011
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30], // 2012
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2013
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2014
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2015
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30], // 2016
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2017
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2018
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2019
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2020
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2021
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 2022
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2023
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2024
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2025
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2026
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2027
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2028
  [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30], // 2029
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2030
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2031
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2032
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2033
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2034
  [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31], // 2035
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2036
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2037
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2038
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30], // 2039
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2040
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2041
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2042
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30], // 2043
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2044
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2045
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2046
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2047
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2048
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 2049
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2050
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2051
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2052
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 2053
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2054
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2055
  [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30], // 2056
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2057
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2058
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2059
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2060
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2061
  [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31], // 2062
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2063
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2064
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2065
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31], // 2066
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2067
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2068
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2069
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30], // 2070
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2071
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2072
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2073
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2074
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2075
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 2076
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2077
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2078
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2079
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 2080
  [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2081
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2082
  [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30], // 2083
  [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30], // 2084
  [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30], // 2085
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2086
  [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30], // 2087
  [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30], // 2088
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2089
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2090
];

/** Epoch anchor: 1913-04-13 UTC = BS 1970-01-01 */
const EPOCH_UTC = Date.UTC(1913, 3, 13);
const MS_PER_DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Returns the number of days in the given BS year and month (1-12).
 */
export function getDaysInBsMonth(year: number, month: number): number {
  if (year < BS_YEAR_MIN || year > BS_YEAR_MAX) return 30;
  if (month < 1 || month > 12) return 30;
  const yearMonths = DAYS_IN_MONTH[year - BS_YEAR_MIN];
  if (!yearMonths) return 30;
  return yearMonths[month - 1] ?? 30;
}

/**
 * Convert Gregorian / AD date string (YYYY-MM-DD) or Date instance to Bikram Sambat (BS).
 * Returns `{ year, month, day, formatted }` or null if out of supported range / invalid.
 */
export function adToBs(dateInput: string | Date | null | undefined): {
  year: number;
  month: number;
  day: number;
  formatted: string;
} | null {
  if (!dateInput) return null;

  let y: number;
  let m: number;
  let d: number;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim().slice(0, 10);
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (!match) return null;
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
  } else {
    y = dateInput.getFullYear();
    m = dateInput.getMonth() + 1;
    d = dateInput.getDate();
  }

  const targetUtc = Date.UTC(y, m - 1, d);
  const daysSinceEpoch = Math.round((targetUtc - EPOCH_UTC) / MS_PER_DAY);
  if (daysSinceEpoch < 0) return null;

  let year = BS_YEAR_MIN;
  let remaining = daysSinceEpoch;

  while (year <= BS_YEAR_MAX) {
    const months = DAYS_IN_MONTH[year - BS_YEAR_MIN];
    if (!months) break;
    let yearTotal = 0;
    for (let i = 0; i < 12; i++) {
      yearTotal += months[i] ?? 0;
    }

    if (remaining < yearTotal) {
      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const mDays = months[monthIdx] ?? 0;
        if (remaining < mDays) {
          const day = remaining + 1;
          const month = monthIdx + 1;
          return {
            year,
            month,
            day,
            formatted: `${year}-${pad(month)}-${pad(day)}`,
          };
        }
        remaining -= mDays;
      }
      return null;
    }
    remaining -= yearTotal;
    year++;
  }

  return null;
}

/**
 * Convert Bikram Sambat (BS) date (year, month 1-12, day 1-32) to Gregorian (AD) Date and YYYY-MM-DD.
 * Returns `{ year, month, day, formatted, date }` or null if invalid / out of range.
 */
export function bsToAd(
  year: number,
  month: number,
  day: number,
): {
  year: number;
  month: number;
  day: number;
  formatted: string;
  date: Date;
} | null {
  if (year < BS_YEAR_MIN || year > BS_YEAR_MAX) return null;
  if (month < 1 || month > 12) return null;
  const yearMonths = DAYS_IN_MONTH[year - BS_YEAR_MIN];
  if (!yearMonths) return null;
  const maxDay = yearMonths[month - 1];
  if (maxDay == null || day < 1 || day > maxDay) return null;

  let days = 0;
  for (let y = BS_YEAR_MIN; y < year; y++) {
    const months = DAYS_IN_MONTH[y - BS_YEAR_MIN];
    if (months) {
      for (let m = 0; m < 12; m++) {
        days += months[m] ?? 0;
      }
    }
  }

  for (let m = 0; m < month - 1; m++) {
    days += yearMonths[m] ?? 0;
  }
  days += day - 1;

  const adUtc = EPOCH_UTC + days * MS_PER_DAY;
  const adDate = new Date(adUtc);

  const adYear = adDate.getUTCFullYear();
  const adMonth = adDate.getUTCMonth() + 1;
  const adDay = adDate.getUTCDate();

  return {
    year: adYear,
    month: adMonth,
    day: adDay,
    formatted: `${adYear}-${pad(adMonth)}-${pad(adDay)}`,
    date: new Date(adYear, adMonth - 1, adDay),
  };
}

/**
 * Parses a BS string in formats like `YYYY-MM-DD`, `YYYY/MM/DD`, or `YYYY.MM.DD`.
 */
export function parseBsDate(bsStr: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!bsStr) return null;
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(bsStr.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < BS_YEAR_MIN || year > BS_YEAR_MAX) return null;
  if (month < 1 || month > 12) return null;
  const maxDay = getDaysInBsMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  return { year, month, day };
}

/**
 * Detailed breakdown of age into years, months, and days.
 * Vital for pediatric & neonatal reference range evaluation in pathology labs.
 */
export interface DetailedAge {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  isPediatric: boolean;
  formatted: string;
}

export function getDetailedAge(
  dobIso: string | null | undefined,
  referenceDate: Date = new Date(),
): DetailedAge | null {
  if (!dobIso) return null;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dobIso.trim().slice(0, 10));
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const birth = new Date(y, m - 1, d);
  if (isNaN(birth.getTime())) return null;

  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  if (ref < birth) {
    return { years: 0, months: 0, days: 0, totalDays: 0, isPediatric: true, formatted: '0 days' };
  }

  const totalDays = Math.round((ref.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  let formatted = '';
  if (years === 0 && months === 0) {
    formatted = `${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (years === 0) {
    formatted = days > 0 ? `${months}m ${days}d` : `${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (years < 2) {
    formatted = months > 0 ? `${years}y ${months}m` : `${years} ${years === 1 ? 'year' : 'years'}`;
  } else {
    formatted = `${years}y`;
  }

  return {
    years,
    months,
    days,
    totalDays,
    isPediatric: years < 18,
    formatted,
  };
}

/**
 * Calculates human age in full years from AD date of birth (YYYY-MM-DD).
 */
export function calculateAgeFromDob(dobIso: string | null | undefined, referenceDate: Date = new Date()): number | null {
  if (!dobIso) return null;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dobIso.trim().slice(0, 10));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birth = new Date(year, month - 1, day);
  if (isNaN(birth.getTime())) return null;

  let age = referenceDate.getFullYear() - year;
  const mDiff = referenceDate.getMonth() - (month - 1);
  if (mDiff < 0 || (mDiff === 0 && referenceDate.getDate() < day)) {
    age--;
  }
  return age >= 0 ? age : 0;
}

/**
 * Human-friendly BS date label, e.g. "15 Shrawan 2050 BS" or "१५ श्रावण २०५०".
 */
export function formatBsDate(
  bs: { year: number; month: number; day: number } | string | null | undefined,
  locale: 'en' | 'ne' = 'en',
): string {
  if (!bs) return '—';
  const parsed = typeof bs === 'string' ? parseBsDate(bs) : bs;
  if (!parsed) return typeof bs === 'string' ? bs : '—';

  const monthObj = NEPALI_MONTHS[parsed.month - 1];
  const monthName = monthObj ? (locale === 'ne' ? monthObj.ne : monthObj.en) : '';
  return `${parsed.day} ${monthName} ${parsed.year} BS`;
}
