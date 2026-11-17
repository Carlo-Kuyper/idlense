/**
 * Mongolia — civil register number (регистрийн дугаар) and the legal-entity
 * register / taxpayer number.
 *
 * MN_RD, 2 Cyrillic letters + 8 digits: ББ YY MM DD S C.
 * - ББ  code of an aimag/district and sum/khoroo. tac.mn says it is that of
 *       the holder's permanent residence (with Ч or У for people born in
 *       Ulaanbaatar); it's unsettled whether the code reflects residence or
 *       birthplace, so we return it as `region` without naming either.
 * - YY  birth year.
 * - MM  birth month; 20 is added for people born in 2000 or later
 *       (01-12 → 1900s, 21-32 → 2000s).
 * - DD  birth day.
 * - S   sex: odd male, even female.
 * - C   a check digit "to verify correct entry"; its algorithm isn't
 *       published, so we don't verify it.
 * The Law on Civil State Registration defines it as 2 letters + 8 digits
 * encoding date of birth and sex; the layout above is from tac.mn, citing the
 * annex to Order No. 331 (2010) of the General Authority for State
 * Registration. Confidence `moderate`. The register number is also the
 * individual's taxpayer number.
 *
 * MN_ENTITY, the 7-digit register number the General Authority for State
 * Registration gives a legal entity (e.g. 2071096 for the Mongolian Stock
 * Exchange), used on tax filings. Commercial guides disagree on whether the
 * tax authority's taxpayer number is always the same number, and no check
 * digit is published. Length only, from secondary sources; confidence `low`.
 *
 * Normalisation: the default `compact()` uppercases only ASCII, so MN_RD uses
 * a local normaliser that also uppercases Cyrillic (incl. Ө and Ү). Latin
 * look-alikes are not mapped to Cyrillic.
 *
 * Not covered: the 12-digit civil registration number (2022 amendment) and
 * the foreigners' F-register number (structures not published).
 */
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** `compact()` plus Cyrillic uppercasing. */
export function normalizeRd(input: string): string {
  return compact(input).replace(/[а-яёүө]/g, (c) => c.toUpperCase());
}

export const documents: DocumentSpec[] = [
  {
    code: "MN_RD",
    country: "MN",
    name: "Mongolian Civil Register Number",
    localName: "Регистрийн дугаар",
    aliases: ["register number", "РД", "registration number", "national ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^[А-ЯЁҮӨ]{2}\d{2}(0[1-9]|1[0-2]|2[1-9]|3[0-2])(0[1-9]|[12]\d|3[01])\d{2}$/,
    example: "АБ90010112",
    sources: [
      "https://legalinfo.mn/en/edtl/15588",
      "https://www.tac.mn/article/33466",
    ],
    normalize: normalizeRd,
    parse(id, { referenceDate }) {
      const yy = Number(id.slice(2, 4));
      let month = Number(id.slice(4, 6));
      const born2000 = month > 20;
      if (born2000) month -= 20;
      const birth = birthFields((born2000 ? 2000 : 1900) + yy, month, Number(id.slice(6, 8)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(id[8]) % 2 === 1 ? "male" : "female",
          region: id.slice(0, 2),
          extra: { checkDigit: id[9]! },
        },
      };
    },
  },
  {
    code: "MN_ENTITY",
    country: "MN",
    name: "Mongolian Legal Entity Register Number",
    localName: "Хуулийн этгээдийн регистрийн дугаар",
    aliases: ["company register number", "регистрийн дугаар", "TTD", "ТТД"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "low",
    lengths: [7],
    pattern: /^\d{7}$/,
    example: "1234567",
    sources: [
      "https://lookuptax.com/docs/tax-identification-number/mongolia-tax-id-guide",
      "https://taxdo.com/resources/global-tax-id-validation-guide/mongolia",
    ],
    normalize: digitsOnly,
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
];
