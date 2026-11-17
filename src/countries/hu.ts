/**
 * Hungary — személyi azonosító, adóazonosító jel, TAJ szám and VAT number.
 * All three personal numbers are defined in 1996. évi XX. törvény (annexes).
 *
 * Személyi azonosító (personal identification number), 11 digits
 * M YYMMDD SSS K (3. melléklet):
 * - M, numbers for people born before 1997 (part I): 1/2 Hungarian
 *   citizen born 1900-1996 (male/female), 3/4 Hungarian born before 1900,
 *   5/6 non-Hungarian born 1900-1996, 7/8 non-Hungarian born before 1900.
 * - M, born from 1997 (part II): 1/2 born 1997-1999, 3/4 born from 2000.
 *   No citizenship marker.
 * - K: part I Σ i·d_i (i = 1..10) mod 11; part II the weights are
 *   reversed (10..1). A serial whose remainder would be 10 is not issued.
 *   3/4 is ambiguous (18YY with part I weights or 20YY with part II); the
 *   check digit decides, preferring 20YY.
 *
 * Adóazonosító jel (personal tax ID), 10 digits (1. melléklet): 8, then
 * the days from 1867-01-01 to the birth date (5 digits), a 3-digit serial,
 * and K = Σ i·d_i (i = 1..9) mod 11; remainder 10 is not issued.
 *
 * TAJ szám (social security number), 9 digits (2. melléklet): an 8-digit
 * running number and K = (3·odd + 7·even positions of the first 8) mod 10.
 *
 * Közösségi adószám (EU VAT): `HU` + the 8-digit adószám törzsszám,
 * weights 9,7,3,1,9,7,3,1 and the sum divisible by 10.
 *
 * Improves on upstream (idnumbers HUN):
 * - always uses the part I weights, so it rejects correctly issued numbers
 *   of everyone born since 1997 and accepts wrong ones;
 * - reads M = 3/4 only as 20YY, never as a Hungarian born before 1900;
 * - accepts M = 5/6 for 1997-1999 (no citizenship marker after 1996) and
 *   future birth dates.
 * idnumbers and nationid have no adóazonosító jel or TAJ.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ExtractedData, ParseOutcome } from "../core/types.js";

const FORWARD = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const REVERSED = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function checkOk(id: string, weights: readonly number[]): boolean {
  const k = weightedSum(id, weights) % 11;
  return k !== 10 && k === Number(id[10]);
}

function parseSzemelyi(id: string, referenceDate: Date): ParseOutcome {
  const m = Number(id[0]);
  const yy = Number(id.slice(1, 3));
  const month = Number(id.slice(3, 5));
  const day = Number(id.slice(5, 7));
  const gender = m % 2 === 1 ? "male" : "female";

  // Candidate readings: [year, weights, citizenship]
  const candidates: [number, readonly number[], string | undefined][] = [];
  if (m <= 2) candidates.push([1900 + yy, yy >= 97 ? REVERSED : FORWARD, yy >= 97 ? undefined : "citizen"]);
  else if (m <= 4) candidates.push([2000 + yy, REVERSED, undefined], [1800 + yy, FORWARD, "citizen"]);
  else if (m <= 6) {
    if (yy >= 97) return { ok: false, reason: "invalid_range" };
    candidates.push([1900 + yy, FORWARD, "foreigner"]);
  } else candidates.push([1800 + yy, FORWARD, "foreigner"]);

  let sawDate = false;
  for (const [year, weights, citizenship] of candidates) {
    const birth = birthFields(year, month, day, referenceDate);
    if (!birth) continue;
    sawDate = true;
    if (!checkOk(id, weights)) continue;
    const data: Omit<ExtractedData, "age"> = { ...birth, gender, serial: id.slice(7, 10), extra: {} };
    if (citizenship) data.citizenship = citizenship;
    return { ok: true, data };
  }
  return { ok: false, reason: sawDate ? "invalid_checksum" : "invalid_date" };
}

/** Civil date from days since 1867-01-01 (proleptic Gregorian, no `Date`). */
export function dateFrom1867(days: number): [number, number, number] {
  // days-from-civil inverse (H. Hinnant), epoch shifted to 0000-03-01.
  const z = days + 681_848; // days from 0000-03-01 to 1867-01-01
  const era = Math.floor(z / 146_097);
  const doe = z - era * 146_097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const mo = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (mo <= 2 ? 1 : 0);
  return [y, mo, d];
}

const LAW = "https://njt.jog.gov.hu/jogszabaly/1996-20-00-00";

export const documents: DocumentSpec[] = [
  {
    code: "HU_SZEMELYI_SZAM",
    country: "HU",
    name: "Hungarian Personal Identification Number",
    localName: "Személyi azonosító",
    aliases: ["személyi szám", "személyi azonosító jel", "personal ID number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^[1-8]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{4}$/,
    example: "18001010016",
    sources: [LAW, "https://hu.wikipedia.org/wiki/Szem%C3%A9lyi_azonos%C3%ADt%C3%B3"],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 6, 4], "-"),
    parse: (id, { referenceDate }) => parseSzemelyi(id, referenceDate),
  },
  {
    code: "HU_ADOAZONOSITO",
    country: "HU",
    name: "Hungarian Personal Tax Identification Number",
    localName: "Adóazonosító jel",
    aliases: ["adóazonosító", "adószám (magánszemély)", "tax ID", "TIN"],
    purpose: "tax",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^8\d{9}$/,
    example: "8412721233",
    sources: [LAW, "https://nav.gov.hu/ugyintezes/adoazonosito_jel"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const [y, m, d] = dateFrom1867(Number(id.slice(1, 6)));
      const birth = birthFields(y, m, d, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      const k = weightedSum(id, FORWARD.slice(0, 9)) % 11;
      if (k === 10 || k !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { ...birth, serial: id.slice(6, 9), extra: {} } };
    },
  },
  {
    code: "HU_TAJ",
    country: "HU",
    name: "Hungarian Social Security Number",
    localName: "Társadalombiztosítási azonosító jel",
    aliases: ["TAJ", "TAJ szám", "health insurance number"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456788",
    sources: [LAW, "https://hu.wikipedia.org/wiki/T%C3%A1rsadalombiztos%C3%ADt%C3%A1si_azonos%C3%ADt%C3%B3_jel"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], " "),
    parse(id) {
      const k = weightedSum(id, [3, 7, 3, 7, 3, 7, 3, 7]) % 10;
      if (k !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(0, 8), extra: {} } };
    },
  },
  {
    code: "HU_VAT",
    country: "HU",
    name: "Hungarian VAT Number",
    localName: "Közösségi adószám",
    aliases: ["adószám", "HU VAT number"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^HU\d{8}$/,
    example: "HU12345676",
    sources: ["https://nav.gov.hu/", "https://ec.europa.eu/taxation_customs/vies/"],
    upstream: ["nationid"],
    normalize: (input) => {
      const c = compact(input);
      return /^\d{8}$/.test(c) ? "HU" + c : c;
    },
    format: (c) => `HU ${c.slice(2)}`,
    parse(id) {
      if (weightedSum(id.slice(2), [9, 7, 3, 1, 9, 7, 3, 1]) % 10 !== 0) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
