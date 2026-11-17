/**
 * United Arab Emirates — Emirates ID number (رقم الهوية), 15 digits:
 * 784-YYYY-NNNNNNN-C.
 *
 * - 784      ISO 3166-1 numeric code of the UAE.
 * - YYYY     year of birth (citizens and residents alike).
 * - NNNNNNN  serial.
 * - C        Luhn check digit over the first 14 digits.
 *
 * Ported from idnumbers and personal-identity-validation.
 *
 * Improves on upstream:
 * - idnumbers accepts any four digits as the birth year (0000, 9999, a year
 *   in the future). We require 1900 ≤ YYYY ≤ the reference year.
 * - personal-identity-validation rejects babies born in the current year
 *   (it requires YYYY < this year), reads "this year" from the UTC clock
 *   instead of the caller's date, and logs to the console on every call.
 */
import { luhnValid } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "AE_EID",
    country: "AE",
    name: "Emirates ID Number",
    localName: "رقم الهوية",
    aliases: ["Emirates ID", "EID", "UAE ID", "resident identity card"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [15],
    pattern: /^784(19|20)\d{10}$/,
    example: "784198012345678",
    sources: [
      "https://icp.gov.ae/en/",
      "https://u.ae/en/information-and-services/visa-and-emirates-id/emirates-id",
      "https://en.wikipedia.org/wiki/National_identification_number#United_Arab_Emirates",
    ],
    upstream: ["idnumbers", "personal-identity-validation"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 4, 7, 1], "-"),
    parse(id, { referenceDate }) {
      const year = Number(id.slice(3, 7));
      if (year > referenceDate.getFullYear()) return { ok: false, reason: "invalid_date" };
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { birthYear: year, serial: id.slice(7, 14), extra: {} } };
    },
  },
];
