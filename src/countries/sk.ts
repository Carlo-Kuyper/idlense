/**
 * Slovakia — rodné číslo (birth number) and IČ DPH (VAT number).
 *
 * Rodné číslo (zákon č. 301/1995 Z. z. o rodnom čísle): the Czechoslovak
 * system both countries kept after 1993, so the rules and the parser live in
 * `cz.ts` (`parseRodneCislo`): 9 digits without a check digit for births
 * before 1954, 10 digits divisible by 11 from 1954, month + 50 for women,
 * + 20 / + 70 overflow series, pre-1985 remainder-10 exception.
 * The overflow series is documented by Czech law (53/2004 Sb.); we found no
 * Slovak text confirming Slovakia issues it, hence `moderate`.
 *
 * IČ DPH: `SK` + 10 digits, first digit 1-9, third digit 2, 3, 4, 7, 8 or 9,
 * whole 10-digit number divisible by 11 (Finančná správa).
 *
 * Improves on upstream (idnumbers SVK, same as CZE):
 * - rejects every 9-digit (pre-1954) number;
 * - reads 10-digit YY 50-53 as 1950-1953 instead of 2050-2053;
 * - rejects the pre-1985 remainder-10 numbers.
 */
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";
import { formatRodneCislo, parseRodneCislo, RC_PATTERN } from "./cz.js";

function divisibleBy11(s: string): boolean {
  let r = 0;
  for (const c of s) r = (r * 10 + (c.charCodeAt(0) - 48)) % 11;
  return r === 0;
}

export const documents: DocumentSpec[] = [
  {
    code: "SK_RC",
    country: "SK",
    name: "Slovak Birth Number",
    localName: "Rodné číslo",
    aliases: ["RČ", "birth number", "personal identification number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [9, 10],
    pattern: RC_PATTERN,
    example: "7103192745",
    sources: [
      "https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1995/301/",
      "https://www.minv.sk/?rodne-cislo",
      "https://sk.wikipedia.org/wiki/Rodn%C3%A9_%C4%8D%C3%ADslo",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: formatRodneCislo,
    parse: (id, { referenceDate }) => parseRodneCislo(id, referenceDate),
  },
  {
    code: "SK_VAT",
    country: "SK",
    name: "Slovak VAT Number",
    localName: "Identifikačné číslo pre daň z pridanej hodnoty",
    aliases: ["IČ DPH", "IC DPH", "SK VAT number"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [12],
    pattern: /^SK[1-9]\d[234789]\d{7}$/,
    example: "SK2021234567",
    sources: ["https://www.financnasprava.sk/", "https://ec.europa.eu/taxation_customs/vies/"],
    upstream: ["nationid"],
    normalize: (input) => {
      const c = compact(input);
      return /^\d{10}$/.test(c) ? "SK" + c : c;
    },
    format: (c) => `SK ${c.slice(2)}`,
    parse(id) {
      if (!divisibleBy11(id.slice(2))) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
