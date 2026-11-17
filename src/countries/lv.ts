/**
 * Latvia — personas kods (personal code) and PVN (VAT) number.
 *
 * Personal codes assigned until 30 June 2017, 11 digits: DDMMYY C NNN K
 * (Cabinet Regulation on the Population Register, transitional provision 4).
 * - C century: 0 → 1800s, 1 → 1900s, 2 → 2000s.
 * - K check digit: (1101 − Σ d·(1,6,3,7,9,10,5,8,4,2)) mod 11, with 10 written as 0.
 *
 * Personal codes assigned since 1 July 2017 (and old codes changed on request),
 * 11 digits: 3, then a random digit 2-9, then nine random digits. The
 * regulation defines no check digit and no encoded data, so this form is
 * shape-only (`LV_PERSONAS_KODS_NEW`).
 *
 * PVN number, `LV` + 11 digits. Legal persons (first digit 4-9): Σ d·(9,1,4,8,
 * 3,10,2,5,7,6,1) mod 11 = 3. Natural persons use their personal code.
 *
 * Improves on upstream:
 * - idnumbers (2.3) runs the legacy check digit over post-2017 codes, which
 *   have none, so it rejects ~90% of them (its later source accepts 32-39
 *   unchecked under a document that claims a check digit). We split them into
 *   a separate shape-only document so `identify()` doesn't treat them as verified.
 * - idnumbers (2.3) checks only the check digit for dated codes: no month/day
 *   or century check, and no future-date check.
 * - nationid's LV_VAT accepts any natural-person number whose first four
 *   digits look like a day and month; we validate it as a personal code
 *   (old form: real past date and check digit; new form: 3[2-9] prefix).
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ParseContext, ParseOutcome } from "../core/types.js";

const PK_WEIGHTS = [1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const VAT_WEIGHTS = [9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1];

/** Check digit of an old-format (dated) personal code. */
export function lvPersonalCheckDigit(body10: string): number {
  return (((1101 - weightedSum(body10, PK_WEIGHTS)) % 11) + 11) % 11 % 10;
}

const OLD_PATTERN = /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{2}[0-2]\d{4}$/;
const NEW_PATTERN = /^3[2-9]\d{9}$/;

function parseOld(id: string, { referenceDate }: ParseContext): ParseOutcome {
  const century = 1800 + Number(id[6]) * 100;
  const birth = birthFields(century + Number(id.slice(4, 6)), Number(id.slice(2, 4)), Number(id.slice(0, 2)), referenceDate);
  if (!birth) return { ok: false, reason: "invalid_date" };
  if (lvPersonalCheckDigit(id.slice(0, 10)) !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
  return { ok: true, data: { ...birth, serial: id.slice(7, 10), extra: {} } };
}

const SOURCES = [
  "https://likumi.lv/ta/id/296185",
  "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/latvia-tin.pdf",
  "https://www.pmlp.gov.lv/en/change-personal-identity-number",
];

function normalizeVat(input: string): string {
  const c = compact(input);
  return /^\d{11}$/.test(c) ? "LV" + c : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "LV_PERSONAS_KODS",
    country: "LV",
    name: "Latvian Personal Code",
    localName: "Personas kods",
    aliases: ["PK", "personal code", "personal identity number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [11],
    // DD 01-31, MM 01-12, century digit 0-2
    pattern: OLD_PATTERN,
    example: "01018010000",
    sources: SOURCES,
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 5], "-"),
    parse: parseOld,
  },
  {
    code: "LV_PERSONAS_KODS_NEW",
    country: "LV",
    name: "Latvian Personal Code (since 2017, no date)",
    localName: "Personas kods",
    aliases: ["PK", "personal code"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [11],
    pattern: NEW_PATTERN,
    example: "32123456789",
    sources: SOURCES,
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 5], "-"),
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "LV_VAT",
    country: "LV",
    name: "Latvian VAT Number",
    localName: "PVN reģistrācijas numurs",
    aliases: ["PVN", "VAT"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [13],
    pattern: /^LV\d{11}$/,
    example: "LV40003521600",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/latvia-tin.pdf",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize: normalizeVat,
    format: (c) => `LV ${c.slice(2)}`,
    parse(id, ctx) {
      const body = id.slice(2);
      if (Number(body[0]) > 3) {
        if (weightedSum(body, VAT_WEIGHTS) % 11 !== 3) return { ok: false, reason: "invalid_checksum" };
        return { ok: true, data: { extra: { kind: "legal_person" } } };
      }
      if (NEW_PATTERN.test(body)) return { ok: true, data: { extra: { kind: "natural_person" } } };
      if (!OLD_PATTERN.test(body)) return { ok: false, reason: "invalid_format" };
      const r = parseOld(body, ctx);
      return r.ok ? { ok: true, data: { extra: { kind: "natural_person" } } } : r;
    },
  },
];
