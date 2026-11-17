/**
 * Kuwait — Civil ID number (الرقم المدني), 12 digits: C YYMMDD SSSS K.
 *
 * - C       century of birth: 2 = 1900s, 3 = 2000s.
 * - YYMMDD  date of birth.
 * - SSSS    serial.
 * - K       check digit: 11 − (Σ d[i] × w[i] mod 11) with weights
 *           2,1,6,3,7,9,10,5,8,4,2; a result of 10 or 11 is never issued.
 * Issued by the Public Authority for Civil Information (PACI) to citizens and
 * residents alike; the number doesn't say which.
 *
 * Ported from idnumbers.
 *
 * Improves on upstream:
 * - idnumbers accepts birth dates in the future (e.g. century 3, year 99).
 * - idnumbers returns the birth date as a local-time `Date`, which shifts by a
 *   day when serialised in timezones west of UTC; we return a plain string.
 */
import { digit } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const WEIGHTS = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

export function civilIdCheckDigit(body11: string): number | undefined {
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += digit(body11, i) * WEIGHTS[i]!;
  const c = 11 - (sum % 11);
  return c >= 10 ? undefined : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "KW_CIVIL_ID",
    country: "KW",
    name: "Kuwaiti Civil ID Number",
    localName: "الرقم المدني",
    aliases: ["Civil ID", "Civil Number", "PACI number", "al-raqam al-madani"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [12],
    pattern: /^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{5}$/,
    example: "280010100012",
    sources: [
      "https://www.paci.gov.kw/",
      "https://django-localflavor.readthedocs.io/en/stable/localflavor/kw/",
      "https://en.wikipedia.org/wiki/National_identification_number#Kuwait",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const year = (id[0] === "2" ? 1900 : 2000) + Number(id.slice(1, 3));
      const birth = birthFields(year, Number(id.slice(3, 5)), Number(id.slice(5, 7)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (civilIdCheckDigit(id) !== digit(id, 11)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { ...birth, serial: id.slice(7, 11), extra: {} } };
    },
  },
];
