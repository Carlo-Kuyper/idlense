/**
 * Tanzania — NIDA National Identification Number (NIN). 20 digits, written
 * YYYYMMDD-AAAAA-SSSSS-XK.
 *
 * - YYYYMMDD date of birth, with the full year. NIDA registers people aged 18
 *            and over, but we don't enforce an age.
 * - AAAAA    a 5-digit code. It varies between people born on the same day
 *            and probably identifies the registration area, but no source says
 *            so; returned raw in `extra.areaCode`.
 * - SSSSS    serial (00001, 00002, ... in every sample).
 * - X        1 or 2 in every sample (1 for the one woman whose name we could
 *            tell, 2 for the one man). Possibly sex, too few samples to say;
 *            returned raw in `extra.digit19`.
 * - K        check digit: Σ d[i]·w[i] mod 10 over the first 19 digits with the
 *            repeating weights 7,3,1 (the ICAO 9303 MRZ check).
 *
 * NIDA doesn't publish the structure. The 20-digit length is stated by NIDA
 * guides and fintech KYC docs. The layout and the check digit are
 * reverse-engineered from 12 NINs quoted in TanzLII judgments: every one starts
 * with a real birth date, and 11 of 12 pass the 7-3-1 check (the odd one out is
 * a likely transcription slip; a random final digit would pass 1 time in 10).
 * Because it is reverse-engineered, confidence is `low`.
 */
import { icaoCheckDigit } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "TZ_NIN",
    country: "TZ",
    name: "Tanzanian National Identification Number",
    localName: "Namba ya Utambulisho wa Taifa",
    aliases: ["NIN", "NIDA number", "NIDA", "Kitambulisho cha Taifa"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "low",
    lengths: [20],
    pattern: /^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{12}$/,
    example: "19850423123450000122",
    sources: [
      "https://tanzlii.org/",
      "https://taxdo.com/resources/faq/post/verify-tanzania-tin-nida-nin-tax-id.md",
    ],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 8)}-${c.slice(8, 13)}-${c.slice(13, 18)}-${c.slice(18)}`,
    parse(id, { referenceDate }) {
      const birth = birthFields(Number(id.slice(0, 4)), Number(id.slice(4, 6)), Number(id.slice(6, 8)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (icaoCheckDigit(id.slice(0, 19)) !== Number(id[19])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          ...birth,
          serial: id.slice(13, 18),
          extra: { areaCode: id.slice(8, 13), digit19: id[18]! },
        },
      };
    },
  },
];
