/**
 * Nigeria — National Identification Number (NIN), 11 digits.
 *
 * Issued by the National Identity Management Commission (NIMC). The number is
 * assigned at random and encodes nothing about the holder; NIMC publishes no
 * check digit, so this is a shape check only (`checksum: false`).
 *
 * Ported from idnumbers. No fixes: there is no documented rule to improve on.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "NG_NIN",
    country: "NG",
    name: "Nigerian National Identification Number",
    aliases: ["NIN", "National Identification Number", "NIMC number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "12345678901",
    sources: [
      "https://nimc.gov.ng/about-nin/",
      "https://en.wikipedia.org/wiki/National_identification_number#Nigeria",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
