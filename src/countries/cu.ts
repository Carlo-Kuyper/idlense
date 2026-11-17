/**
 * Cuba — número de identidad permanente on the carné de identidad. 11 digits:
 * YYMMDD C SS G X.
 *
 * - YYMMDD date of birth.
 * - C      century: 9 → 1800s, 0-5 → 1900s, 6-8 → 2000s.
 * - SS     sequence for people born the same day.
 * - G      sex: even male, odd female.
 * - X      final digit. Described as a control digit, but no algorithm is
 *          published, so it isn't verified (checksum: false).
 *
 * Confidence is low: MININT doesn't publish the layout; it comes from
 * secondary sources that agree with each other. No upstream library has it.
 */
import { birthFields } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export function cubaCentury(c: number): number {
  if (c === 9) return 1800;
  return c <= 5 ? 1900 : 2000;
}

export const documents: DocumentSpec[] = [
  {
    code: "CU_CI",
    country: "CU",
    name: "Cuban Identity Card Number",
    localName: "Carné de identidad",
    aliases: ["CI", "carnet de identidad", "número de identidad permanente"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [11],
    pattern: /^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{5}$/,
    example: "86120501234",
    sources: [
      "https://lookuptax.com/docs/es/numero-identificacion-fiscal/guia-nit-carnet-identidad-cuba",
      "https://arthurdejong.org/python-stdnum/doc/stdnum.cu.ni",
    ],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const year = cubaCentury(Number(id[6])) + Number(id.slice(0, 2));
      const birth = birthFields(year, Number(id.slice(2, 4)), Number(id.slice(4, 6)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(id[9]) % 2 === 0 ? "male" : "female",
          serial: id.slice(7, 9),
          extra: { centuryDigit: Number(id[6]) },
        },
      };
    },
  },
];
