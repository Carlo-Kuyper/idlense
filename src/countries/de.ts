/**
 * Germany — tax numbers. Germany has no general personal ID number; the
 * Steuer-ID (IdNr) is the lifelong per-person number.
 *
 * DE_STEUER_ID — Steuerliche Identifikationsnummer, § 139b AO. 11 digits:
 *   - first digit 1-9;
 *   - in the first 10 digits exactly one digit occurs twice or three times,
 *     every other digit at most once (so 8 or 9 distinct digits);
 *   - a digit that occurs three times must not fill three directly
 *     consecutive positions (the check digit doesn't count);
 *   - digit 11: ISO/IEC 7064 MOD 11,10 over the first 10 (BZSt / ELSTER
 *     "Prüfung der Steuer- und Steueridentifikationsnummer").
 *   Nothing else is encoded: no date of birth, no gender.
 *
 * DE_STEUERNUMMER — per-Land tax number: 10 or 11 digits in the Land's
 *   own layout, or the 13-digit nationwide ELSTER form FFFF0BBBUUUUP
 *   (4-digit Bundesfinanzamtsnummer, a literal 0, district + serial, check
 *   digit). The check digit is Land-specific, so only the shape is checked.
 *
 * DE_USTID — USt-IdNr: `DE` + 9 digits, first 1-9, last digit ISO 7064
 *   MOD 11,10 over the first 8.
 *
 * Improves on upstream:
 * - Steuer-ID: nationid misses the "no three identical digits in a row"
 *   rule; idnumbers accepts a leading 0, a body where no digit repeats, and
 *   one where the repeated digit occurs four or more times.
 * - Steuernummer: nationid accepts any 10-13 digits; we reject 12 digits
 *   (no Land uses that length) and 13-digit numbers whose fifth digit isn't
 *   the 0 the nationwide format requires.
 */
import { iso7064HybridCheck } from "../core/algorithms.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** § 139b AO repetition rules on the first 10 digits. */
export function steuerIdRepetitionOk(body10: string): boolean {
  const counts = new Map<string, number>();
  for (const c of body10) counts.set(c, (counts.get(c) ?? 0) + 1);
  const repeated = [...counts.values()].filter((v) => v > 1);
  if (repeated.length !== 1 || repeated[0]! > 3) return false;
  for (let i = 0; i + 2 < body10.length; i++) {
    if (body10[i] === body10[i + 1] && body10[i] === body10[i + 2]) return false;
  }
  return true;
}

const mod11_10 = (body: string, check: string) => iso7064HybridCheck(body, 10) === Number(check);

export const documents: DocumentSpec[] = [
  {
    code: "DE_STEUER_ID",
    country: "DE",
    name: "German Tax Identification Number",
    localName: "Steuerliche Identifikationsnummer",
    aliases: ["IdNr", "Steuer-ID", "TIN", "Steueridentifikationsnummer"],
    purpose: "tax",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^[1-9]\d{10}$/,
    example: "86095742719",
    sources: [
      "https://www.gesetze-im-internet.de/ao_1977/__139b.html",
      "https://www.bzst.de/DE/Privatpersonen/SteuerlicheIdentifikationsnummer/steuerlicheidentifikationsnummer_node.html",
      "https://download.elster.de/download/schnittstellen/Pruefung_der_Steuer_und_Steueridentifikatsnummer.pdf",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [2, 3, 3, 3], " "),
    parse(id) {
      if (!steuerIdRepetitionOk(id.slice(0, 10))) return { ok: false, reason: "invalid_format" };
      if (!mod11_10(id.slice(0, 10), id[10]!)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "DE_STEUERNUMMER",
    country: "DE",
    name: "German Tax Number",
    localName: "Steuernummer",
    aliases: ["StNr", "St.-Nr."],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [10, 11, 13],
    pattern: /^(\d{10,11}|\d{4}0\d{8})$/,
    example: "9181081508155",
    sources: [
      "https://download.elster.de/download/schnittstellen/Pruefung_der_Steuer_und_Steueridentifikatsnummer.pdf",
      "https://de.wikipedia.org/wiki/Steuernummer",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse(id) {
      if (id.length === 13) {
        return { ok: true, data: { region: id.slice(0, 4), extra: { format: "nationwide" } } };
      }
      return { ok: true, data: { extra: { format: "land" } } };
    },
  },
  {
    code: "DE_USTID",
    country: "DE",
    name: "German VAT Identification Number",
    localName: "Umsatzsteuer-Identifikationsnummer",
    aliases: ["USt-IdNr", "VAT number", "USt-ID"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^DE[1-9]\d{8}$/,
    example: "DE136695976",
    sources: [
      "https://www.bzst.de/DE/Unternehmen/Identifikationsnummern/Umsatzsteuer-Identifikationsnummer/umsatzsteuer-identifikationsnummer_node.html",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize: (s) => {
      const c = compact(s);
      return /^\d{9}$/.test(c) ? "DE" + c : c;
    },
    format: (c) => "DE " + group(c.slice(2), [3, 3, 3], " "),
    parse(id) {
      if (!mod11_10(id.slice(2, 10), id[10]!)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
