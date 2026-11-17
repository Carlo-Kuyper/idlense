/**
 * Somalia — National ID number issued by the National Identification and
 * Registration Authority (NIRA, established 2023).
 *
 * 11 digits. The length comes from one secondary source (LookupTax's Somalia
 * BIN page, which warns that the 11-digit National ID looks like a business
 * number). NIRA doesn't publish the structure or a check digit, so this is
 * shape-only with confidence `low`.
 *
 * The 11-digit Business Identification Number from the Ministry of Commerce
 * and Industry is a company-register number, not a tax number, so it isn't
 * modelled; it has the same shape, so the two can't be told apart.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "SO_NIN",
    country: "SO",
    name: "Somali National Identification Number",
    aliases: ["NIN", "NIRA ID", "national ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "12345678901",
    sources: ["https://lookuptax.com/validate/somalia/bin", "https://en.wikipedia.org/wiki/National_identification_number"],
    normalize: digitsOnly,
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
];
