/**
 * Sri Lanka — National Identity Card number (Department for Registration of
 * Persons). Two formats, both still in circulation:
 *
 * - Old (until 2015): `YY DDD SSS C L`, 9 digits + letter. YY is 19YY.
 *   L is `V` (voter) or `X` (non-voter); since 2007 every card ends in `V`.
 * - New (from 1 January 2016): `YYYY DDD SSSS C`, 12 digits. An old number
 *   converts as 19YY DDD 0SSS C.
 *
 * DDD is the day of the year of birth, 001-366 for men and 501-866 (+500)
 * for women. The day count always uses a 366-day year: February is counted
 * as 29 days every year, so day 060 is 29 February and day 061 is 1 March
 * even in a common year (where 060 is never issued).
 *
 * C is a mod-11 check digit, weights 8,4,3,2,7,6,5,7,4,3,2 over the 12-digit
 * form, check = 11 - (sum mod 11), with 10 → 0 and 11 → 1. For an old
 * number this reduces to weights 3,2,7,6,5,4,3,2 over its first 8 digits.
 * DRP doesn't publish the algorithm; it is taken from idnumbers and
 * validates the specimen on Wikipedia (911042754V).
 *
 * Ported from idnumbers (LKA).
 *
 * Improves on upstream:
 * - idnumbers `validate` accepts any day number (000, 367-500, 867-999)
 *   and future birth dates; we reject them as `invalid_date`.
 * - idnumbers decodes the day against the real calendar, so every birthday
 *   after February in a common year comes out one day late, and it builds a
 *   local `Date` (timezone-shifted). We use the 366-day table and plain
 *   Y-M-D strings; day 060/560 in a common year is rejected.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import type { DocumentSpec, ExtractedData } from "../core/types.js";

const WEIGHTS = [8, 4, 3, 2, 7, 6, 5, 7, 4, 3, 2];
/** Cumulative days before each month in the NIC's 366-day year. */
const MONTH_START = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Check digit for the first 11 digits of the 12-digit form. */
export function lkCheckDigit(first11: string): number {
  const c = 11 - (weightedSum(first11, WEIGHTS) % 11);
  return c > 9 ? c % 10 : c;
}

/** NIC day number (1-366, without the female +500) to month/day. */
export function lkDayToDate(day: number): { month: number; day: number } | undefined {
  if (day < 1 || day > 366) return undefined;
  let m = 0;
  while (day > MONTH_START[m + 1]!) m++;
  return { month: m + 1, day: day - MONTH_START[m]! };
}

export const documents: DocumentSpec[] = [
  {
    code: "LK_NIC",
    country: "LK",
    name: "Sri Lankan National Identity Card Number",
    localName: "ජාතික හැඳුනුම්පත",
    aliases: ["NIC", "National ID", "ජාහැ"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [10, 12],
    pattern: /^(\d{9}[VX]|\d{12})$/,
    example: "199010400273",
    sources: [
      "https://www.irb-cisr.gc.ca/en/country-information/rir/Pages/index.aspx?doc=451823",
      "https://en.wikipedia.org/wiki/National_identity_card_(Sri_Lanka)",
    ],
    upstream: ["idnumbers"],
    parse(id, { referenceDate }) {
      const old = id.length === 10;
      const full = old ? `19${id.slice(0, 5)}0${id.slice(5, 9)}` : id;
      const year = Number(full.slice(0, 4));
      let dayNo = Number(full.slice(4, 7));
      const female = dayNo > 500;
      if (female) dayNo -= 500;
      const md = lkDayToDate(dayNo);
      if (!md || (md.month === 2 && md.day === 29 && !isLeap(year))) return { ok: false, reason: "invalid_date" };
      const birth = birthFields(year, md.month, md.day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (lkCheckDigit(full) !== Number(full[11])) return { ok: false, reason: "invalid_checksum" };
      const extra: ExtractedData["extra"] = old ? { format: "old", newNumber: full, voterLetter: id[9]! } : { format: "new" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: female ? "female" : "male",
          serial: full.slice(7, 11),
          extra,
        },
      };
    },
  },
];
