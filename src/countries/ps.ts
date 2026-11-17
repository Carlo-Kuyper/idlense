/**
 * Palestine — Palestinian identity number (رقم الهوية), 9 digits.
 *
 * Palestinian ID numbers come from the population registry shared with the
 * Israeli Civil Administration since the Oslo accords, and use the same
 * scheme as Israel's Teudat Zehut: 8 digits + a Luhn check digit. The number
 * encodes nothing about the holder.
 *
 * Ported from personal-identity-validation (first digit 1-9, Luhn). idnumbers
 * has no Palestinian module. No fixes were needed; confidence is moderate
 * because the shared-scheme claim rests on secondary sources.
 */
import { luhnValid } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "PS_ID",
    country: "PS",
    name: "Palestinian Identity Number",
    localName: "رقم الهوية",
    aliases: ["Palestinian ID", "hawiya"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [9],
    pattern: /^[1-9]\d{8}$/,
    example: "400000006",
    sources: [
      "https://en.wikipedia.org/wiki/Palestinian_identity_card",
      "https://www.moi.pna.ps/",
    ],
    upstream: ["personal-identity-validation"],
    normalize: digitsOnly,
    format: (c) => group(c, [8, 1], "-"),
    parse(id) {
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
