/**
 * Rwanda — national identity number (indangamuntu), issued by NIDA.
 * 16 digits: S YYYY G NNNNNNN I CC.
 *
 * - S        holder status (citizen, refugee or foreigner). Which value means
 *            which isn't published, so the raw digit goes in `extra.statusDigit`.
 * - YYYY     year of birth.
 * - G        gender: 8 male, 7 female.
 * - NNNNNNN  birth-order sequence.
 * - I        how many times an ID has been issued to the holder.
 * - CC       "security code". Its algorithm isn't published, so we don't
 *            verify it.
 *
 * Shape-only. The layout comes from one news explainer (KT Press, 2025) and
 * no official NIDA spec was found, so confidence is `low`. A birth year after
 * the reference year is rejected as `invalid_date`.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "RW_NID",
    country: "RW",
    name: "Rwandan National Identity Number",
    localName: "Indangamuntu",
    aliases: ["NID", "NIN", "national ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [16],
    // status, year 19xx/20xx, gender 7/8, 10 more digits
    pattern: /^\d(19|20)\d{2}[78]\d{10}$/,
    example: "1199080000001012",
    sources: [
      "https://www.ktpress.rw/2025/06/why-are-rwandans-getting-multiple-national-id-numbers-auditor-general-points-to-a-system-flaw/",
      "https://www.nida.gov.rw/",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 4, 1, 7, 1, 2], " "),
    parse(id, { referenceDate }) {
      const birthYear = Number(id.slice(1, 5));
      if (birthYear > referenceDate.getFullYear()) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: {
          birthYear,
          gender: id[5] === "8" ? "male" : "female",
          serial: id.slice(6, 13),
          extra: {
            statusDigit: id[0]!,
            issueCount: Number(id[13]),
            securityCode: id.slice(14),
          },
        },
      };
    },
  },
];
