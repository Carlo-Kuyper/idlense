/**
 * Uzbekistan — PINFL (JShShIR, personal identification number of a natural
 * person). 14 digits: G DDMMYY RRR NNN C.
 *
 * - G      sex and century: 1/2 → 1800s, 3/4 → 1900s, 5/6 → 2000s; odd male, even female.
 * - DDMMYY date of birth.
 * - RRR    district/city code of the registering office (for foreigners and
 *          stateless persons: where they applied, incl. consulates). The
 *          classifier isn't published with the regulation, so no names.
 * - NNN    sequence among people born that day in that district.
 * - C      Σ digit[i] · (7,3,1,7,3,1,...) over the first 13 digits, mod 10.
 *
 * Rules and the worked example 3 121093 204 024 7 come from the administrative
 * regulation approved by Cabinet of Ministers Resolution No. 177 of 12.04.2022.
 * No upstream library covers Uzbekistan.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const WEIGHTS = [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7];
const CENTURY: Record<string, number> = { "1": 1800, "2": 1800, "3": 1900, "4": 1900, "5": 2000, "6": 2000 };

export function pinflCheckDigit(first13: string): number {
  return weightedSum(first13, WEIGHTS) % 10;
}

export const documents: DocumentSpec[] = [
  {
    code: "UZ_PINFL",
    country: "UZ",
    name: "Uzbek Personal Identification Number",
    localName: "JShShIR",
    aliases: ["PINFL", "ПИНФЛ", "ЖШШИР", "personal identification number of an individual"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [14],
    pattern: /^[1-6](0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{9}$/,
    example: "31210932040247",
    sources: [
      "https://lex.uz/docs/5955665",
      "https://kun.uz/en/news/2026/01/26/how-to-find-your-pinfl",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 6, 3, 3, 1], " "),
    parse(id, { referenceDate }) {
      const century = CENTURY[id[0]!]!;
      const day = Number(id.slice(1, 3));
      const month = Number(id.slice(3, 5));
      const birth = birthFields(century + Number(id.slice(5, 7)), month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (pinflCheckDigit(id) !== Number(id[13])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(id[0]) % 2 === 1 ? "male" : "female",
          region: id.slice(7, 10),
          serial: id.slice(10, 13),
          extra: {},
        },
      };
    },
  },
];
