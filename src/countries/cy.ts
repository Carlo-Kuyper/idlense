/**
 * Cyprus — Tax Identification Code (ΑΦΤ / TIC), also the VAT number.
 *
 * 8 digits + 1 uppercase Latin check letter, issued to individuals and entities
 * (Assessment and Collection of Taxes Law 1978, art. 5/5A). The check letter:
 * digits at even positions (0,2,4,6) are mapped 0→1, 1→0, 2→5, 3→7, 4→9, 5→13,
 * 6→15, 7→17, 8→19, 9→21; digits at odd positions count as themselves; the sum
 * mod 26 indexes A-Z. VAT numbers are the same code with a `CY` prefix (optional
 * on input, dropped). Numbers starting `12` are not issued (VIES rule).
 *
 * Improves on upstream:
 * - idnumbers accepts the unissued `12` prefix; nationid rejects it, so do we
 *   (reported as `invalid_range`).
 * - idnumbers' `is_individual` (first digit 0 or 9) is not exposed: since
 *   27/3/2023 the Tax For All system issues numbers from 60000000 to everyone
 *   (OECD TIN sheet, April 2023), so the first digit no longer tells person from
 *   company.
 */
import type { DocumentSpec } from "../core/types.js";
import { compact } from "../core/normalize.js";

const EVEN = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21];

export function cyCheckLetter(body8: string): string {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = body8.charCodeAt(i) - 48;
    sum += i % 2 === 0 ? EVEN[d]! : d;
  }
  return String.fromCharCode(65 + (sum % 26));
}

export const documents: DocumentSpec[] = [
  {
    code: "CY_VAT",
    country: "CY",
    name: "Cyprus Tax Identification Code",
    localName: "Αριθμός Φορολογικής Ταυτότητας",
    aliases: ["TIC", "TIN", "ΑΦΤ", "ΦΠΑ", "Cyprus VAT number"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{8}[A-Z]$/,
    example: "00123456H",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Cyprus-TIN.pdf",
      "https://ec.europa.eu/taxation_customs/vies/",
      "https://en.wikipedia.org/wiki/VAT_identification_number",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize: (input) => compact(input).replace(/^CY(?=\d)/, ""),
    parse(id) {
      if (id.startsWith("12")) return { ok: false, reason: "invalid_range" };
      if (cyCheckLetter(id) !== id[8]) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
