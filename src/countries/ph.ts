/**
 * Philippines — PhilSys (Philippine Identification System, RA 11055).
 *
 * - PSN (PhilSys Number): a randomly generated, permanent 12-digit number.
 *   It is confidential; PSA tells holders to use the PCN instead.
 * - PCN (PhilSys Card Number): the 16-digit number printed on the PhilID,
 *   derived from the PSN.
 * Neither encodes personal data, and PSA doesn't publish a check digit, so
 * only the shape is checked (`checksum: false`).
 *
 * Improves on upstream: idnumbers only knows the PSN; we add the PCN, which
 * is the number people actually see on their card.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const SOURCES = [
  "https://psa.gov.ph/content/psa-begins-issuance-psn-and-philid-successful-registrants",
  "https://www.officialgazette.gov.ph/2018/08/06/republic-act-no-11055/",
  "https://en.wikipedia.org/wiki/Philippine_national_identity_card",
];

export const documents: DocumentSpec[] = [
  {
    code: "PH_PSN",
    country: "PH",
    name: "PhilSys Number",
    aliases: ["PSN", "Philippine national ID number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [12],
    pattern: /^\d{12}$/,
    example: "123456789012",
    sources: SOURCES,
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 7, 1], "-"),
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "PH_PCN",
    country: "PH",
    name: "PhilSys Card Number",
    aliases: ["PCN", "PhilID card number", "national ID card number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [16],
    pattern: /^\d{16}$/,
    example: "1234567890123456",
    sources: [
      "https://psa.gov.ph/content/psa-bsp-promote-philid-card-security-and-verification-features",
      ...SOURCES,
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 4, 4], "-"),
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
