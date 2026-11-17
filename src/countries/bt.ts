/**
 * Bhutan — Citizenship Identity Card (CID) number.
 *
 * 11 digits. No official layout is published. Two independent explainers
 * (blogs) describe it as S DD GG NNNNNN:
 * - S      census category digit (1/2/3, tied to the census form used).
 * - DD     dzongkhag (district) code.
 * - GG     gewog (sub-district) code.
 * - NNNNNN serial.
 * We extract the codes raw (no name table) and check only the length.
 * Confidence `low`: secondary sources only, and the fourth-generation card
 * (2025) may use a different scheme. No check digit is known.
 *
 * Not covered: the taxpayer number (TPN). DRC doesn't publish its format and
 * third-party sites contradict each other.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "BT_CID",
    country: "BT",
    name: "Bhutanese Citizenship Identity Card Number",
    aliases: ["CID", "CID number", "citizenship ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "11410012345",
    sources: [
      "https://phubdorjiwang.blogspot.com/2019/03/interpretation-of-our-bhutanese.html",
      "https://amrithdiary.blogspot.com/2016/03/what-does-your-cid-number-tell-about-you.html",
    ],
    normalize: digitsOnly,
    parse(id) {
      return {
        ok: true,
        data: { region: id.slice(1, 3), serial: id.slice(5), extra: { censusCategory: id[0]!, gewog: id.slice(3, 5) } },
      };
    },
  },
];
