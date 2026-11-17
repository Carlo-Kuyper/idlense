/**
 * Ethiopia — Fayda number and Ministry of Revenues TIN.
 *
 * ET_FIN, the Fayda identification number issued by the National ID Program
 * (NIDP) under the Digital Identification Proclamation 1284/2023: a 12-digit
 * number (Wikipedia, citing NIDP). Fayda runs on MOSIP, whose default UIN
 * generator ends in a Verhoeff check digit, but NIDP doesn't say whether it
 * kept that, so we don't verify one. Nothing else is encoded (MOSIP numbers
 * are random). Shape-only, confidence `low`.
 *
 * ET_TIN, the taxpayer number: 10 digits, often with leading zeros, e.g.
 * 0012814908 from the Ministry of Revenues' own verification example. A branch
 * may add a sub-TIN suffix (0012814908-14); strip it before validating, as
 * only the main 10 digits are accepted.
 * No check digit is published. Confidence `low`.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "ET_FIN",
    country: "ET",
    name: "Ethiopian Fayda Identification Number",
    localName: "ፋይዳ",
    aliases: ["Fayda", "Fayda ID", "Fayda number", "FIN", "national ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [12],
    pattern: /^\d{12}$/,
    example: "123456789012",
    sources: ["https://id.gov.et/", "https://en.wikipedia.org/wiki/Fayda_ID"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 4], " "),
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "ET_TIN",
    country: "ET",
    name: "Ethiopian Taxpayer Identification Number",
    aliases: ["TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "0012814908",
    sources: ["https://lookuptax.com/validate/ethiopia/tin"],
    normalize: digitsOnly,
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
];
