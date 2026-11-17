/**
 * Papua New Guinea — National Identification Number (NID), 10 digits, issued
 * by the PNG Civil and Identity Registry.
 *
 * No check digit or structure is published, so this is a shape check only
 * (`checksum: false`, low confidence).
 *
 * Ported from idnumbers; no fixes needed beyond what the shape allows.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "PG_NID",
    country: "PG",
    name: "Papua New Guinea National Identification Number",
    aliases: ["NID", "national ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234567890",
    sources: ["https://en.wikipedia.org/wiki/National_identification_number#Papua_New_Guinea"],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
