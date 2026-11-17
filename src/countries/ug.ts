/**
 * Uganda — NIN (National Identification Number), issued by NIRA and printed
 * on the Ndaga Muntu card. 14 alphanumeric characters: K G YY SSSSSSSSSS.
 *
 * - K  applicant class: C Ugandan citizen, F foreign/non-citizen record. Other
 *      letters are accepted but not mapped.
 * - G  gender: M or F.
 * - YY last two digits of the birth year. The century isn't encoded, so we
 *      take the latest year that isn't in the future.
 * - S  10-character NIRA-assigned serial (digits and letters).
 *
 * NIRA publishes no check algorithm, so this is shape-only. The layout comes
 * from one third-party validator and matches the "CM…/CF…" form seen on
 * cards, but no official NIRA spec was found: confidence `low`.
 */
import { latestPastYear } from "../core/dates.js";
import type { DocumentSpec } from "../core/types.js";

export const UG_CLASS: Record<string, string> = {
  C: "citizen",
  F: "foreigner",
};

export const documents: DocumentSpec[] = [
  {
    code: "UG_NIN",
    country: "UG",
    name: "Ugandan National Identification Number",
    aliases: ["NIN", "Ndaga Muntu", "national ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [14],
    pattern: /^[A-Z][MF]\d{2}[0-9A-Z]{10}$/,
    example: "CF85000012345A",
    sources: [
      "https://www.nira.go.ug/",
      "https://gera-tools.pages.dev/uganda-nin-validator",
      "https://bills.parliament.ug/attachments/Laws%20of%20Uganda%20(Acts)%20-%20THE%20REGISTRATION%20OF%20PERSONS%20ACT,%202015.pdf",
    ],
    parse(id, { referenceDate }) {
      const birthYear = latestPastYear(Number(id.slice(2, 4)), 1, 1, referenceDate);
      if (birthYear === undefined) return { ok: false, reason: "invalid_date" };
      const citizenship = UG_CLASS[id[0]!];
      return {
        ok: true,
        data: {
          birthYear,
          gender: id[1] === "M" ? "male" : "female",
          ...(citizenship ? { citizenship } : {}),
          serial: id.slice(4),
          extra: { applicantClass: id[0]! },
        },
      };
    },
  },
];
