/**
 * Hong Kong — Hong Kong Identity Card number (HKID): one or two letters, six
 * digits and a check character in brackets, e.g. A123456(3) or WX123456(?).
 *
 * Check character: letters are worth A=10 ... Z=35 and a one-letter prefix
 * is padded with a leading space worth 36. Weights 9..2 over the eight
 * positions; check = 11 - (sum mod 11), where 10 is written A and 11 is 0.
 * The number encodes no birth date or gender; the prefix only reflects when
 * and where the card was first issued, so it is returned as `extra.prefix`.
 *
 * Improves on upstream (idnumbers): no logic changes were needed; inputs
 * with lowercase letters, full-width characters or unbalanced brackets are
 * normalised instead of rejected.
 */
import { alnumValue } from "../core/algorithms.js";
import type { DocumentSpec } from "../core/types.js";

export function hkidCheckChar(body: string): string {
  const padded = body.length === 7 ? " " + body : body;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const ch = padded[i]!;
    sum += (ch === " " ? 36 : alnumValue(ch)) * (9 - i);
  }
  const c = (11 - (sum % 11)) % 11;
  return c === 10 ? "A" : String(c);
}

export const documents: DocumentSpec[] = [
  {
    code: "HK_HKID",
    country: "HK",
    name: "Hong Kong Identity Card Number",
    localName: "香港身份證號碼",
    aliases: ["HKID", "Hong Kong ID card", "HKIC"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [8, 9],
    pattern: /^[A-Z]{1,2}\d{6}[\dA]$/,
    example: "A1234563",
    sources: [
      "https://www.immd.gov.hk/eng/services/hkid/smartid.html",
      "https://en.wikipedia.org/wiki/Hong_Kong_identity_card",
    ],
    upstream: ["idnumbers"],
    format: (c) => `${c.slice(0, -1)}(${c.slice(-1)})`,
    parse(id) {
      if (hkidCheckChar(id.slice(0, -1)) !== id[id.length - 1]) return { ok: false, reason: "invalid_checksum" };
      const prefixLen = id.length - 7;
      return {
        ok: true,
        data: {
          serial: id.slice(prefixLen, prefixLen + 6),
          extra: { prefix: id.slice(0, prefixLen), checkDigit: id[id.length - 1]! },
        },
      };
    },
  },
];
