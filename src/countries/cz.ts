/**
 * Czechia — rodné číslo (birth number), ČSSZ insurance number (EČP) and DIČ.
 *
 * Rodné číslo (zákon č. 133/2000 Sb., § 13; shared with Slovakia, which
 * imports the helper below): YYMMDD/SSS[C].
 * - Born before 1954: 9 digits, no check digit (§ 13 odst. 4). ČSSZ reads
 *   YY 00-53 as 19YY and YY 54-99 as 18YY; serial 000 is not issued.
 * - From 1954: 10 digits, the whole number divisible by 11 (§ 13 odst. 3).
 *   YY 54-99 → 19YY, YY 00-53 → 20YY.
 * - Month + 50 for women. Since 2004, when a day's serials run out, month
 *   + 20 for men / + 70 for women (§ 13 odst. 5, as amended by 53/2004 Sb.);
 *   that supplementary set is always 10 digits.
 * - Until 1985 about a thousand numbers were issued whose first nine digits
 *   leave remainder 10 mod 11, with check digit 0. We accept these only for
 *   birth years 1954-1985 and flag them (`extra.checkDigitException`).
 *
 * EČP (evidenční číslo pojištěnce, ČSSZ): the RČ shape with day + 40, for
 * foreigners without an RČ. Serial ≥ 600 (9 digits) / ≥ 6000 (10 digits);
 * day + 40 combined with month + 20 is invalid (ČSSZ checks 5, 10, 11).
 *
 * DIČ (daňové identifikační číslo): `CZ` + 8 digits for legal entities
 * (weights 8..2, check = (11 - Σ mod 11) mod 10, first digit not 9), or
 * `CZ` + rodné číslo for individuals. The 9-digit "special" branch
 * (`CZ6…`, people without an RČ) isn't supported: we found no issuer
 * publication of its check rule.
 *
 * Improves on upstream:
 * - idnumbers rejects every 9-digit (pre-1954) rodné číslo.
 * - idnumbers reads 10-digit YY 50-53 as 1950-1953; 10-digit numbers only
 *   exist from 1954, so these are 2050-2053 (future → rejected).
 * - idnumbers applies the +20 overflow to 9-digit numbers and accepts it
 *   combined with any month; we keep it to the 10-digit set.
 * - idnumbers accepts future birth dates and rejects the pre-1985
 *   remainder-10 numbers.
 * - nationid CZ_DIC covers only the 8-digit entity branch; we add the
 *   individuals' RČ-based DIČ (holder `both`).
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

/** Remainder of a decimal digit string mod 11 (safe for any length). */
function mod11(s: string): number {
  let r = 0;
  for (const c of s) r = (r * 10 + (c.charCodeAt(0) - 48)) % 11;
  return r;
}

export interface RodneCisloOptions {
  /** Accept the ČSSZ EČP variant (day + 40) instead of a plain RČ. */
  ecp?: boolean;
}

/**
 * Parse a compact 9/10-digit rodné číslo (CZ and SK) or, with `ecp`, a
 * ČSSZ insurance number. Shape (length, digits) is checked by the caller.
 */
export function parseRodneCislo(id: string, referenceDate: Date, opts: RodneCisloOptions = {}): ParseOutcome {
  if (!/^\d{9,10}$/.test(id)) return { ok: false, reason: "invalid_format" };
  const long = id.length === 10;
  const yy = Number(id.slice(0, 2));
  let month = Number(id.slice(2, 4));
  let day = Number(id.slice(4, 6));
  const serial = id.slice(6, 9);

  let female = false;
  if (month > 50) {
    female = true;
    month -= 50;
  }
  let overflow = false;
  if (month > 20) {
    overflow = true;
    month -= 20;
  }
  if (month < 1 || month > 12) return { ok: false, reason: "invalid_date" };
  if (overflow && !long) return { ok: false, reason: "invalid_format" };

  const ecp = day > 40;
  if (ecp !== Boolean(opts.ecp)) return { ok: false, reason: "invalid_format" };
  if (ecp) {
    day -= 40;
    if (overflow) return { ok: false, reason: "invalid_format" };
    const s = Number(long ? id.slice(6, 10) : serial);
    if (s < (long ? 6000 : 600)) return { ok: false, reason: "invalid_range" };
  }
  if (!long && serial === "000") return { ok: false, reason: "invalid_range" };

  const year = long ? (yy >= 54 ? 1900 : 2000) + yy : (yy >= 54 ? 1800 : 1900) + yy;
  const birth = birthFields(year, month, day, referenceDate);
  if (!birth) return { ok: false, reason: "invalid_date" };

  const extra: Record<string, string | number | boolean> = {};
  if (long) {
    if (mod11(id) !== 0) {
      const exception = mod11(id.slice(0, 9)) === 10 && id[9] === "0" && year <= 1985;
      if (!exception) return { ok: false, reason: "invalid_checksum" };
      extra.checkDigitException = true;
    }
  }
  if (overflow) extra.overflowSeries = true;
  return {
    ok: true,
    data: {
      ...birth,
      gender: female ? "female" : "male",
      ...(ecp ? { citizenship: "foreigner" } : {}),
      serial: long ? id.slice(6, 10) : serial,
      extra,
    },
  };
}

export const formatRodneCislo = (c: string): string => `${c.slice(0, 6)}/${c.slice(6)}`;

/**
 * RČ pattern: YY, month (01-12, 21-32, 51-62, 71-82), day 01-31 (EČP 41-71).
 * Shared with SK.
 */
export const RC_PATTERN = /^\d{2}(0[1-9]|1[0-2]|2[1-9]|3[0-2]|5[1-9]|6[0-2]|7[1-9]|8[0-2])(0[1-9]|[12]\d|3[01])\d{3,4}$/;
const ECP_PATTERN = /^\d{2}(0[1-9]|1[0-2]|5[1-9]|6[0-2])(4[1-9]|[56]\d|7[01])\d{3,4}$/;

const DIC_WEIGHTS = [8, 7, 6, 5, 4, 3, 2];

/** DIČ: strip separators; a bare 8-10 digit number gets the `CZ` prefix. */
function normalizeDic(input: string): string {
  const c = compact(input);
  return /^\d{8,10}$/.test(c) ? "CZ" + c : c;
}

const RC_SOURCES = [
  "https://www.zakonyprolidi.cz/cs/2000-133#p13",
  "https://www.cssz.gov.cz/standardni-kontrola-rodneho-cisla-a-evidencniho-cisla-pojistence",
  "https://cs.wikipedia.org/wiki/Rodn%C3%A9_%C4%8D%C3%ADslo",
];

export const documents: DocumentSpec[] = [
  {
    code: "CZ_RC",
    country: "CZ",
    name: "Czech Birth Number",
    localName: "Rodné číslo",
    aliases: ["RČ", "birth number", "personal identification number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9, 10],
    pattern: RC_PATTERN,
    example: "7103192745",
    sources: RC_SOURCES,
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: formatRodneCislo,
    parse: (id, { referenceDate }) => parseRodneCislo(id, referenceDate),
  },
  {
    code: "CZ_ECP",
    country: "CZ",
    name: "Czech Social Insurance Number for Foreigners",
    localName: "Evidenční číslo pojištěnce",
    aliases: ["EČP", "ECP", "insurance registration number"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9, 10],
    pattern: ECP_PATTERN,
    example: "7103596005",
    sources: ["https://www.cssz.gov.cz/standardni-kontrola-rodneho-cisla-a-evidencniho-cisla-pojistence"],
    normalize: digitsOnly,
    format: formatRodneCislo,
    parse: (id, { referenceDate }) => parseRodneCislo(id, referenceDate, { ecp: true }),
  },
  {
    code: "CZ_DIC",
    country: "CZ",
    name: "Czech Tax Identification Number (VAT)",
    localName: "Daňové identifikační číslo",
    aliases: ["DIČ", "DIC", "CZ VAT number"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [10, 11, 12],
    pattern: /^CZ\d{8,10}$/,
    example: "CZ12345679",
    sources: [
      "https://www.financnisprava.cz/cs/dane/dane/dan-z-pridane-hodnoty",
      "https://www.zakonyprolidi.cz/cs/2004-235",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize: normalizeDic,
    format: (c) => `CZ ${c.slice(2)}`,
    parse(id, { referenceDate }) {
      const body = id.slice(2);
      if (body.length === 8) {
        if (body[0] === "9") return { ok: false, reason: "invalid_range" };
        const check = (11 - (weightedSum(body, DIC_WEIGHTS) % 11)) % 10;
        if (check !== Number(body[7])) return { ok: false, reason: "invalid_checksum" };
        return { ok: true, data: { extra: { kind: "legal_entity" } } };
      }
      if (!RC_PATTERN.test(body)) return { ok: false, reason: "invalid_format" };
      const r = parseRodneCislo(body, referenceDate);
      if (!r.ok) return r;
      return { ok: true, data: { ...r.data, extra: { ...r.data.extra, kind: "individual" } } };
    },
  },
];
