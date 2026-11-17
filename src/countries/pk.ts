/**
 * Pakistan — Computerised National Identity Card number (CNIC), issued by
 * NADRA. Also printed on NICOP (overseas) cards. 13 digits: `PDDDT-FFFFFFF-G`.
 *
 * - P      province/territory: 1 Khyber Pakhtunkhwa, 2 FATA (now merged into
 *          KP), 3 Punjab, 4 Sindh, 5 Balochistan, 6 Islamabad,
 *          7 Gilgit-Baltistan, 8 Azad Jammu and Kashmir.
 * - PDDDT  the whole first block is the registration locality (province,
 *          division, district, tehsil/union council).
 * - FFFFFFF family/serial number.
 * - G      gender: odd male, even female.
 *
 * NADRA publishes no check digit, so this is a structural check.
 *
 * Ported from idnumbers (PAK).
 *
 * Improves on upstream: idnumbers accepts a leading 0 or 9, which are not
 * province codes; we reject them as `invalid_range` and name the province.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const PK_PROVINCES: Record<string, string> = {
  "1": "Khyber Pakhtunkhwa",
  "2": "Federally Administered Tribal Areas",
  "3": "Punjab",
  "4": "Sindh",
  "5": "Balochistan",
  "6": "Islamabad Capital Territory",
  "7": "Gilgit-Baltistan",
  "8": "Azad Jammu and Kashmir",
};

export const documents: DocumentSpec[] = [
  {
    code: "PK_CNIC",
    country: "PK",
    name: "Pakistani Computerised National Identity Card Number",
    localName: "قومی شناختی کارڈ",
    aliases: ["CNIC", "NIC", "NICOP", "شناختی کارڈ"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [13],
    pattern: /^\d{13}$/,
    example: "3520212345671",
    sources: [
      "https://www.nadra.gov.pk/identity/identity-cnic/",
      "https://en.wikipedia.org/wiki/CNIC_(Pakistan)",
      "https://tribune.com.pk/story/1403682/theres-cnic-number-know",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [5, 7, 1], "-"),
    parse(id) {
      const regionName = PK_PROVINCES[id[0]!];
      if (!regionName) return { ok: false, reason: "invalid_range" };
      return {
        ok: true,
        data: {
          gender: Number(id[12]) % 2 === 1 ? "male" : "female",
          region: id[0]!,
          regionName,
          serial: id.slice(5, 12),
          extra: { locality: id.slice(0, 5) },
        },
      };
    },
  },
];
