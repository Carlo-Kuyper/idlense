/** Date helpers. Everything works on plain Y/M/D numbers; no `Date` objects leak out. */

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

export function isoDate(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** True for a real calendar date (rejects Feb 30, Feb 29 in non-leap years, month 13). */
export function isRealDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(2000, month - 1, day));
  d.setUTCFullYear(year);
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/** `YYYY-MM-DD` of `date` in local time. */
export function todayIso(date: Date): string {
  return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** True when Y-M-D is a real date and not after `referenceDate`. */
export function isPastDate(year: number, month: number, day: number, referenceDate: Date): boolean {
  return isRealDate(year, month, day) && isoDate(year, month, day) <= todayIso(referenceDate);
}

/**
 * Pick the century for a two-digit year: the latest century whose date is a
 * real date not after `referenceDate`. Use when the number doesn't encode the
 * century (ZA, many others). Returns the full year or undefined.
 *
 * `oldest` caps how far back to go (default 1900).
 */
export function latestPastYear(
  yy: number,
  month: number,
  day: number,
  referenceDate: Date,
  oldest = 1900,
): number | undefined {
  for (let century = Math.floor(referenceDate.getFullYear() / 100) * 100; century >= oldest - 99; century -= 100) {
    const year = century + yy;
    if (year < oldest) break;
    if (isPastDate(year, month, day, referenceDate)) return year;
  }
  return undefined;
}

export function ageOn(dateOfBirth: string, referenceDate: Date): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const rm = referenceDate.getMonth() + 1;
  const rd = referenceDate.getDate();
  let age = referenceDate.getFullYear() - y;
  if (rm < mo || (rm === mo && rd < d)) age -= 1;
  return age >= 0 ? age : undefined;
}

/** Helper for modules: the common birth-date fields, or a failure. */
export function birthFields(
  year: number,
  month: number,
  day: number,
  referenceDate: Date,
): { dateOfBirth: string; birthYear: number } | undefined {
  if (!isPastDate(year, month, day, referenceDate)) return undefined;
  return { dateOfBirth: isoDate(year, month, day), birthYear: year };
}
