/**
 * Laos — Taxpayer Identification Number.
 *
 * 12 digits per Prime Minister's Decree No. 354/PM (5 Oct 2007), Art. 4:
 * NNNNNNNN C V BB.
 * - NNNNNNNN sequence number.
 * - C        a control digit "to prevent mistakes in inserting data". The
 *            algorithm isn't published, so we don't verify it.
 * - V        9 = VAT-registered, 0 = not VAT-registered.
 * - BB       branch code, 00 for an enterprise without branches.
 * The decree writes it `aaaaaaaab-9cc`, with a hyphen before the VAT digit;
 * `format` renders that (e.g. 123456785-900).
 * Confidence `moderate`: the decree is law, but since 2019 TINs come from
 * TaxRIS and individuals got TINs in 2021 (Notification 0831/MoF); we
 * couldn't confirm the 2007 layout still applies to those.
 *
 * Not covered: the Lao ID card and family book numbers (no source).
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "LA_TIN",
    country: "LA",
    name: "Lao Taxpayer Identification Number",
    aliases: ["TIN", "tax identification number"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [12],
    pattern: /^\d{9}[09]\d{2}$/,
    example: "123456785900",
    sources: [
      "https://www.laotradeportal.gov.la/upload/files/Legal_1559286512.pdf",
      "https://documents1.worldbank.org/curated/en/907731573054558479/pdf/Improving-Starting-a-Business-in-Lao-PDR.pdf",
    ],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 9)}-${c.slice(9)}`,
    parse(id) {
      return {
        ok: true,
        data: {
          serial: id.slice(0, 8),
          extra: { controlDigit: id[8]!, vatRegistered: id[9] === "9", branch: id.slice(10) },
        },
      };
    },
  },
];
