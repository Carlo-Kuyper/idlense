/**
 * Luxembourg — national identification number (matricule), VAT number and
 * legal-entity identification number.
 *
 * Matricule (since 2014), 13 digits: YYYY MM DD SSS C1 C2.
 * - YYYYMMDD date of birth (the full year is encoded).
 * - SSS      sequence; it no longer encodes the sex.
 * - C1       Luhn check digit over the first 11 digits.
 * - C2       Verhoeff check digit over the first 11 digits (C1 left out).
 *
 * VAT (TVA): LU + 8 digits; the last two = first six mod 89.
 *
 * Entity identifier (LU_MATRICULE_ENTITY): the 11-digit national identifier
 * of non-natural persons under the law of 30 March 1979, which the tax
 * administration uses as the entity TIN. Per Luxembourg's OECD TIN sheet the
 * 11th digit is 11 − (Σ first 10 digits × 5,4,3,2,7,6,5,4,3,2 mod 11); a
 * remainder of 0 gives check digit 0 and a remainder of 1 is never allocated
 * (we report those bodies as `invalid_range`). Neither the sheet nor the 1979
 * law publishes what the first 10 digits encode, so nothing is extracted.
 * Confidence `moderate`: the issuer publishes the rule, but we found no
 * published real identifiers to cross-check it against.
 * (Bill 8680 of 2026 notes the current number can change when an entity's
 * legal form or activity changes, which suggests it is not purely a serial,
 * but gives no layout; it would replace it with a meaningless 11-digit INE.)
 *
 * Improves on upstream:
 * - idnumbers builds a local-time `Date` for the birth date; we return a plain
 *   `YYYY-MM-DD` and reject birth dates after the reference date.
 */
import { luhnCheckDigit, verhoeffValid, weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export function luVatCheck(body6: string): string {
  return String(Number(body6) % 89).padStart(2, "0");
}

const ENTITY_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Check digit of a non-natural person's identifier, or undefined when the remainder is 1 (never allocated). */
export function luEntityCheckDigit(first10: string): number | undefined {
  const r = weightedSum(first10, ENTITY_WEIGHTS) % 11;
  if (r === 1) return undefined;
  return r === 0 ? 0 : 11 - r;
}

const OECD_SHEET = "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/luxembourg-tin.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "LU_MATRICULE",
    country: "LU",
    name: "Luxembourg National Identification Number",
    localName: "Numéro d'identification national (matricule)",
    aliases: ["matricule", "NIN", "numéro d'identité", "CCSS number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: /^(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{5}$/,
    example: "1893120105732",
    sources: [
      "https://ctie.gouvernement.lu/fr/services/identification-personnes-physiques.html",
      OECD_SHEET,
      "https://en.wikipedia.org/wiki/National_identification_number#Luxembourg",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 2, 2, 5], " "),
    parse(id, { referenceDate }) {
      const birth = birthFields(Number(id.slice(0, 4)), Number(id.slice(4, 6)), Number(id.slice(6, 8)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      const body = id.slice(0, 11);
      if (luhnCheckDigit(body) !== Number(id[11]) || !verhoeffValid(body + id[12])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { ...birth, serial: id.slice(8, 11), extra: {} } };
    },
  },
  {
    code: "LU_VAT",
    country: "LU",
    name: "Luxembourg VAT Number",
    localName: "Numéro d'identification à la TVA",
    aliases: ["TVA", "VAT number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^LU\d{8}$/,
    example: "LU15027442",
    sources: ["https://pfi.public.lu/fr.html", "https://ec.europa.eu/taxation_customs/vies/"],
    upstream: ["nationid"],
    normalize(input) {
      const c = compact(input);
      return /^\d{8}$/.test(c) ? "LU" + c : c;
    },
    format: (c) => `LU ${c.slice(2)}`,
    parse: (id) => (luVatCheck(id.slice(2, 8)) === id.slice(8) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
  {
    code: "LU_MATRICULE_ENTITY",
    country: "LU",
    name: "Luxembourg Legal Entity Identification Number",
    localName: "Numéro d'identité des personnes morales (matricule)",
    aliases: ["matricule", "entity matricule", "numéro de dossier", "TIN"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "19992401233",
    sources: [
      OECD_SHEET,
      "https://legilux.public.lu/eli/etat/leg/loi/1979/03/30/n1/jo",
      "https://impotsdirects.public.lu/fr/az/n/num__ro_dossier.html",
      "https://wdocs-pub.chd.lu/docs/Dossiers_parlementaires/8680/20260107_Depot.pdf",
    ],
    normalize: digitsOnly,
    parse(id) {
      const check = luEntityCheckDigit(id);
      if (check === undefined) return { ok: false, reason: "invalid_range" };
      if (check !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
