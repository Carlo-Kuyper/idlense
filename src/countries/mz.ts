/**
 * Mozambique — NUIT (Número Único de Identificação Tributária), the tax
 * number for people and organisations. 9 digits: T SSSSSSS C.
 *
 * - T       type of taxpayer. What each value means isn't published, so we
 *           return the raw digit in `extra.typeDigit`.
 * - SSSSSSS sequential number.
 * - C       check digit: Σ d[i]·w[i] over the first 8 digits with weights
 *           8,9,4,5,6,7,8,9. The remainder mod 11 is the check digit, and a
 *           remainder of 10 is written as 1.
 *
 * The Autoridade Tributária doesn't publish the algorithm. python-stdnum's
 * documentation describes it, and we implemented it from that description,
 * not from its code. It matches all 78 valid sample NUITs that project
 * published, and its one invalid sample fails. That makes it very likely
 * correct, but it still has a single unofficial source, so confidence is `low`.
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const WEIGHTS = [8, 9, 4, 5, 6, 7, 8, 9];

/** Check digit for the first 8 digits of a NUIT. */
export function nuitCheckDigit(first8: string): number {
  const r = weightedSum(first8, WEIGHTS) % 11;
  return r === 10 ? 1 : r;
}

export const documents: DocumentSpec[] = [
  {
    code: "MZ_NUIT",
    country: "MZ",
    name: "Mozambican Taxpayer Identification Number",
    localName: "Número Único de Identificação Tributária",
    aliases: ["NUIT", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "low",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456785",
    sources: [
      "https://www.at.gov.mz/por/Perguntas-Frequentes2/NUIT",
      "https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.mz.nuit",
      "https://lists.arthurdejong.org/python-stdnum-commits/2025/msg00027.html",
      "https://org-id.guide/list/MZ-NUIT",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], " "),
    parse(id) {
      if (nuitCheckDigit(id.slice(0, 8)) !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(1, 8), extra: { typeDigit: id[0]! } } };
    },
  },
];
