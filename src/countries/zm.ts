/**
 * Zambia — National Registration Card (NRC) number. 9 digits, written
 * SSSSSS/DD/N (the first card, issued in 1965, was 000001/11/1).
 *
 * - SSSSSS sequential number within the issuing district, from 000001.
 * - DD     district code: the first digit is the province, the second the
 *          district (11 = Lusaka, 61 = Ndola, 82 = Mongu). No full table is
 *          published, so we return the raw code without a name.
 * - N      nationality: 1 Zambian, 2 Commonwealth citizen, 3 other foreigner.
 *
 * No check digit. Every source agrees on the 6/2/1 shape (Zambian Observer,
 * a verification API's docs, the ZamAuthentic validator). The meaning of each
 * part comes from one newspaper explainer, so confidence is `low`. A sequence
 * of 000000 was never issued and is rejected as `invalid_range`.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const ZM_NATIONALITY: Record<string, string> = {
  "1": "citizen",
  "2": "commonwealth_citizen",
  "3": "foreigner",
};

export const documents: DocumentSpec[] = [
  {
    code: "ZM_NRC",
    country: "ZM",
    name: "Zambian National Registration Card Number",
    aliases: ["NRC", "national registration card"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [9],
    // last digit is the nationality code 1-3
    pattern: /^\d{8}[1-3]$/,
    example: "123456111",
    sources: [
      "https://zambianobserver.com/the-national-registration-card-was-introduced-in-1965-the-first-card-000001-11-1-was-issued-to-kaunda/",
      "https://github.com/Munalula-Sikazwe/ZamAuthentic",
      "https://docs.dojah.io/api-reference/individual-verification/zambia/national-id.md",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 2, 1], "/"),
    parse(id) {
      const serial = id.slice(0, 6);
      if (serial === "000000") return { ok: false, reason: "invalid_range" };
      const region = id.slice(6, 8);
      return {
        ok: true,
        data: {
          citizenship: ZM_NATIONALITY[id[8]!]!,
          region,
          serial,
          extra: { provinceDigit: region[0]! },
        },
      };
    },
  },
];
