/**
 * United Kingdom — National Insurance number, NHS number, UTR and VAT number.
 *
 * NINO (HMRC NIM39110): two prefix letters, six digits, suffix A-D.
 * - D, F, I, Q, U, V never appear in the prefix; O is never the second letter.
 * - BG, GB, KN, NK, NT, TN, ZZ are never allocated.
 * - FY, NC, PY, PZ (and OO, TN) are administrative/temporary references, not NINOs;
 *   PP999999P is a placeholder (its P suffix already fails the A-D rule).
 * No check character.
 *
 * NHS number: 10 digits, mod 11 with weights 10..2 (11 → 0, 10 never issued).
 * The same scheme covers the Scottish CHI range (010101 0000 – 311299 9999)
 * and Northern Ireland's H&C range (320 000 0000 – 399 999 9999).
 *
 * UTR: 10 digits; the FIRST digit checks the other nine (weights 6,7,8,9,10,5,4,3,2,
 * remainder r mod 11 → "21987654321"[r]).
 *
 * VAT: GB + 9 digits (+ 3-digit branch), HMRC mod 97 (weights 8..2 plus the last
 * two digits, total ≡ 0 or ≡ 42 i.e. the "9755" scheme), or GD000-499 (government
 * departments) / HA500-999 (health authorities). XI prefix for Northern Ireland
 * (Windsor Framework, since 2021) uses the same number.
 *
 * Improves on upstream:
 * - idnumbers accepts NINO suffixes F, M and P; HMRC: the suffix is always A-D.
 * - Neither upstream rejects the administrative prefixes FY, NC, PY, PZ
 *   (reported as `invalid_range`).
 * - nationid's UTR check maps remainder 0 to check digit 0 and rejects remainder 1;
 *   the mapping is 0 → 2, 1 → 1 (11 − r otherwise).
 * - nationid GB_VAT doesn't accept GD/HA numbers or the XI (Northern Ireland) prefix.
 * - GB_NHS reports which issuer's range the number falls in.
 */
import { weightedSum } from "../core/algorithms.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const NINO_ADMIN_PREFIXES = new Set(["FY", "NC", "PY", "PZ"]);

export function nhsCheckDigit(body9: string): number | undefined {
  const c = (11 - (weightedSum(body9, [10, 9, 8, 7, 6, 5, 4, 3, 2]) % 11)) % 11;
  return c === 10 ? undefined : c;
}

export function utrCheckDigit(body9: string): number {
  return Number("21987654321"[weightedSum(body9, [6, 7, 8, 9, 10, 5, 4, 3, 2]) % 11]);
}

/** HMRC mod-97: "standard" (≡ 0) or "9755" (≡ 42) scheme, else undefined. */
export function gbVatScheme(nine: string): "standard" | "9755" | undefined {
  const total = weightedSum(nine, [8, 7, 6, 5, 4, 3, 2]) + Number(nine.slice(7, 9));
  if (total % 97 === 0) return "standard";
  if ((total + 55) % 97 === 0) return "9755";
  return undefined;
}

function nhsRegion(n: string): string {
  const v = Number(n);
  if (v >= 101010000 && v <= 3112999999) return "scotland";
  if (v >= 3200000000 && v <= 3999999999) return "northern_ireland";
  return "england_wales_iom";
}

function normalizeVat(input: string): string {
  const c = compact(input);
  return /^\d{9}(\d{3})?$/.test(c) ? "GB" + c : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "GB_NINO",
    country: "GB",
    name: "UK National Insurance Number",
    aliases: ["NINO", "NI number", "National Insurance number"],
    purpose: "social_security",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [9],
    pattern: /^(?!BG|GB|KN|NK|NT|TN|ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-D]$/,
    example: "AB123456C",
    sources: [
      "https://www.gov.uk/hmrc-internal-manuals/national-insurance-manual/nim39110",
      "https://en.wikipedia.org/wiki/National_Insurance_number",
    ],
    upstream: ["idnumbers", "nationid"],
    format: (c) => group(c, [2, 2, 2, 2, 1], " "),
    parse(id) {
      if (NINO_ADMIN_PREFIXES.has(id.slice(0, 2))) return { ok: false, reason: "invalid_range" };
      return { ok: true, data: { region: id.slice(0, 2), serial: id.slice(2, 8), extra: { suffix: id[8]! } } };
    },
  },
  {
    code: "GB_NHS",
    country: "GB",
    name: "NHS Number",
    aliases: ["NHS number", "CHI number", "H&C number"],
    purpose: "health",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "9434765919",
    sources: [
      "https://www.datadictionary.nhs.uk/attributes/nhs_number.html",
      "https://www.ndc.scot.nhs.uk/Dictionary-A-Z/Definitions/index.asp?ID=128",
      "https://en.wikipedia.org/wiki/NHS_number",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 4], " "),
    parse(id) {
      const c = nhsCheckDigit(id.slice(0, 9));
      if (c === undefined || c !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: { issuer: nhsRegion(id) } } };
    },
  },
  {
    code: "GB_UTR",
    country: "GB",
    name: "UK Unique Taxpayer Reference",
    aliases: ["UTR", "SA UTR", "CT UTR"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "9234567891",
    sources: ["https://www.gov.uk/find-utr-number", "https://www.accountingweb.co.uk/any-answers/check-digit-for-utr"],
    upstream: ["nationid"],
    // HMRC writes a trailing K on some notices; it isn't part of the number.
    normalize: (s) => digitsOnly(s),
    format: (c) => group(c, [5, 5], " "),
    parse(id) {
      // The check digit is the first digit, so the contract's "last char" test can't apply;
      // the example's last digit is part of the body and changing it does break the check.
      if (utrCheckDigit(id.slice(1)) !== Number(id[0])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "GB_VAT",
    country: "GB",
    name: "UK VAT Registration Number",
    aliases: ["VRN", "VAT number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [7, 11, 14],
    pattern: /^(?:(?:GB|XI)\d{9}(?:\d{3})?|(?:GB|XI)(?:GD[0-4]|HA[5-9])\d{2})$/,
    example: "GB980780684",
    sources: [
      "https://www.gov.uk/guidance/vat-registration-numbers",
      "https://www.gov.uk/government/publications/vat-notice-7001-should-i-be-registered-for-vat",
      "https://en.wikipedia.org/wiki/VAT_identification_number",
    ],
    upstream: ["nationid"],
    normalize: normalizeVat,
    format: (c) => (/^(GB|XI)\d/.test(c) ? `${c.slice(0, 2)} ${group(c.slice(2), [3, 4, 2, 3], " ")}` : c),
    parse(id) {
      const prefix = id.slice(0, 2);
      const rest = id.slice(2);
      if (/^(GD|HA)/.test(rest)) {
        return { ok: true, data: { extra: { prefix, kind: rest.startsWith("GD") ? "government" : "health_authority" } } };
      }
      const scheme = gbVatScheme(rest.slice(0, 9));
      if (!scheme) return { ok: false, reason: "invalid_checksum" };
      const extra: Record<string, string> = { prefix, scheme };
      if (rest.length === 12) extra.branch = rest.slice(9);
      return { ok: true, data: { extra } };
    },
  },
];
