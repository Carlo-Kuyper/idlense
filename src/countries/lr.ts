/**
 * Liberia — Liberia Revenue Authority TIN.
 *
 * The LRA's own TIN page describes it as "a 9-digit number beginning with 5"
 * (revenue.lra.gov.lr/?p=9216). Companies get theirs from the Liberia
 * Business Registry, individuals from the LRA. LEITI's reconciliation reports
 * print company TINs in this shape (e.g. 500036301 for ArcelorMittal
 * Liberia). No check digit is published. Confidence `moderate`: the issuer
 * states the shape and published numbers match it, but it doesn't say whether
 * older TINs all follow it.
 *
 * The national ID (NIR) number isn't modelled: we found no published format.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "LR_TIN",
    country: "LR",
    name: "Liberian Taxpayer Identification Number",
    aliases: ["TIN", "LRA TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^5\d{8}$/,
    example: "512345678",
    sources: ["https://revenue.lra.gov.lr/?p=9216", "https://lookuptax.com/validate/liberia/tin"],
    normalize: digitsOnly,
    parse(id) {
      return { ok: true, data: { serial: id.slice(1), extra: {} } };
    },
  },
];
