/**
 * Botswana — Omang (national identity card) number. 9 digits.
 *
 * - The number is the citizen's unique identification number. It is issued at
 *   birth registration and carried onto the Omang at 16 (World Bank ID4D
 *   diagnostic).
 * - The middle (5th) digit is 1 for men and 2 for women (Immigration and
 *   Refugee Board of Canada response on Refworld, citing Botswana's Ministry of
 *   Labour and Home Affairs and its Washington embassy).
 * - Only citizens get an Omang.
 *
 * No check-digit algorithm is published, so this is shape-only. Confidence is
 * `low`: the gender digit comes from one reputable secondary source, and no
 * other part of the layout is documented.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "BW_OMANG",
    country: "BW",
    name: "Botswana National Identity Card Number",
    localName: "Omang",
    aliases: ["Omang", "national ID", "UIN"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [9],
    // 5th digit is the gender digit: 1 or 2
    pattern: /^\d{4}[12]\d{4}$/,
    example: "123416789",
    sources: [
      "https://www.refworld.org/docid/4f9e34252.html",
      "https://id4d.worldbank.org/sites/id4d/files/2018-04/Botswana_ID4D_DiagnosticWeb040418.pdf",
      "https://www.botswanaembassy.org/node/1767",
    ],
    normalize: digitsOnly,
    parse(id) {
      return {
        ok: true,
        data: {
          gender: id[4] === "1" ? "male" : "female",
          citizenship: "citizen",
          extra: {},
        },
      };
    },
  },
];
