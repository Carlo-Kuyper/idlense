/**
 * Tunisia — CIN number and the Matricule Fiscal (tax ID).
 *
 * TN_CIN, the 8-digit number on the Carte d'Identité Nationale. The World Bank
 * diagnostic of Tunisia's ID systems (2020) says it is issued sequentially from
 * blocks allocated to each region, with no check digit (the "control digits" on
 * the card belong to its barcode, not to the number). The region blocks aren't
 * published, so nothing is extracted. Shape-only, confidence `moderate`.
 *
 * TN_MF, the Matricule Fiscal from the Direction Générale des Impôts, written
 * NNNNNNN/K/T/C/EEE (older notation "345 769 JAM 000"):
 * - NNNNNNN identifier, 7 digits (often printed without leading zeros; we pad).
 * - K       check letter from the 23 letters A-Z without I, O, U.
 * - T       VAT code: A, P, B, D or N.
 * - C       category code: M, P, C, N, or E (secondary establishment).
 *           Returned raw; the other letters' meanings aren't sourced.
 * - EEE     establishment number: 000 for the main establishment; any other
 *           value requires category E.
 * The short form NNNNNNNK (identifier + key) is also accepted.
 *
 * The check letter: Σ digit × (7,6,5,4,3,2,1) mod 23, as an index into
 * "ABCDEFGHJKLMNPQRSTVWXYZ". The DGI doesn't publish it; it comes from an Odoo
 * localisation module. We confirmed it against python-stdnum's documented
 * examples (1282182W, 1496298T, 0000121J) and two companies' numbers printed in
 * the JORT announcements (849034Z/A/M/000 and 345 769 JAM 000), five
 * independent matches with a 1-in-23 chance each. Confidence `moderate`.
 */
import { compact, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";
import { digit } from "../core/algorithms.js";

const MF_LETTERS = "ABCDEFGHJKLMNPQRSTVWXYZ";

export function tnMfCheckLetter(digits7: string): string {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += digit(digits7, i) * (7 - i);
  return MF_LETTERS[sum % 23]!;
}

/** Compact, then left-pad the identifier to 7 digits when printed without leading zeros. */
function normalizeMf(input: string): string {
  const c = compact(input);
  const m = /^(\d{1,6})([A-Z].*)$/.exec(c);
  return m ? m[1]!.padStart(7, "0") + m[2]! : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "TN_CIN",
    country: "TN",
    name: "Tunisian National Identity Card Number",
    localName: "بطاقة التعريف الوطنية / Carte d'Identité Nationale",
    aliases: ["CIN", "CNI"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "01234567",
    sources: ["https://documents1.worldbank.org/curated/en/368931596533672339/text/Diagnostic-of-ID-Systems-in-Tunisia.txt"],
    normalize: (s) => compact(s),
    parse(id) {
      return { ok: true, data: { serial: id, extra: {} } };
    },
  },
  {
    code: "TN_MF",
    country: "TN",
    name: "Tunisian Tax Identification Number",
    localName: "Matricule Fiscal",
    aliases: ["MF", "matricule fiscal", "identifiant fiscal", "المعرف الجبائي"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    checkIndex: 7,
    confidence: "moderate",
    lengths: [8, 13],
    pattern: /^\d{7}[A-HJ-NP-TV-Z](?:[APBDN][MPCNE]\d{3})?$/,
    example: "1282182WAM000",
    sources: [
      "https://apps.odoo.com/apps/modules/17.0/tn_vat_validation",
      "https://arthurdejong.org/python-stdnum/doc/2.1/stdnum.tn.mf",
      "https://www.jurist.org/news/wp-content/uploads/sites/4/2022/07/077Journal-annonces2022.pdf",
    ],
    normalize: normalizeMf,
    format: (c) => (c.length === 13 ? group(c, [7, 1, 1, 1, 3], "/") : group(c, [7, 1], "/")),
    parse(id) {
      if (tnMfCheckLetter(id.slice(0, 7)) !== id[7]) return { ok: false, reason: "invalid_checksum" };
      const extra: Record<string, string> = { checkLetter: id[7]! };
      if (id.length === 13) {
        const establishment = id.slice(10);
        if (establishment !== "000" && id[9] !== "E") return { ok: false, reason: "invalid_format" };
        extra.vatCode = id[8]!;
        extra.category = id[9]!;
        extra.establishment = establishment;
      }
      return { ok: true, data: { serial: id.slice(0, 7), extra } };
    },
  },
];
