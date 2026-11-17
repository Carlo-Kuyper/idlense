/**
 * Netherlands — Burgerservicenummer (BSN) and btw-identificatienummer (VAT).
 *
 * BSN: 9 digits (legacy systems drop a leading zero, so 8 digits are padded).
 * "11-proef": 9·d1 + 8·d2 + ... + 2·d8 − 1·d9 ≡ 0 (mod 11). 000000000 is never issued.
 * The BSN encodes nothing about the holder.
 *
 * btw-id: NL + 9 digits + B + 2 digits.
 * - Before 2020 (and still for legal entities) the 9 digits pass the 11-proef
 *   (they were the BSN/RSIN).
 * - Since 1 January 2020 sole traders get a btw-id unrelated to the BSN, checked with
 *   ISO 7064 MOD 97-10 over the whole string "NL…B.." (letters as 10-35).
 * B00 isn't issued.
 *
 * Improves on upstream:
 * - nationid's NL_BTW applies MOD 97-10 to the 9 core digits only; Belastingdienst
 *   (and VIES) apply it to the whole identifier including "NL" and "B..". Its rule
 *   accepts invalid numbers and rejects valid post-2020 ones.
 */
import { mod97, weightedSum } from "../core/algorithms.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** The BSN 11-proef. */
export function elevenProof(nine: string): boolean {
  const sum = weightedSum(nine, [9, 8, 7, 6, 5, 4, 3, 2]) - (nine.charCodeAt(8) - 48);
  return sum % 11 === 0;
}

export const documents: DocumentSpec[] = [
  {
    code: "NL_BSN",
    country: "NL",
    name: "Dutch Citizen Service Number",
    localName: "Burgerservicenummer",
    aliases: ["BSN", "sofinummer"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^(?!0{9})\d{9}$/,
    example: "111222333",
    sources: [
      "https://www.rvig.nl/burgerservicenummer",
      "https://www.government.nl/topics/personal-data/citizen-service-number-bsn",
      "https://nl.wikipedia.org/wiki/Burgerservicenummer",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize(input) {
      const d = digitsOnly(input);
      return d.length === 8 ? "0" + d : d;
    },
    format: (c) => group(c, [4, 2, 3], "."),
    parse: (id) => (elevenProof(id) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
  {
    code: "NL_BTW",
    country: "NL",
    name: "Dutch VAT Identification Number",
    localName: "Btw-identificatienummer",
    aliases: ["btw-id", "BTW", "omzetbelastingnummer", "VAT number"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [14],
    pattern: /^NL\d{9}B(?!00)\d{2}$/,
    example: "NL123456789B13",
    sources: [
      "https://www.belastingdienst.nl/wps/wcm/connect/nl/btw/content/btw-id-controleren",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize(input) {
      const c = compact(input);
      return /^\d{9}B\d{2}$/.test(c) ? "NL" + c : c;
    },
    format: (c) => c,
    parse(id) {
      if (elevenProof(id.slice(2, 11))) return { ok: true, data: { extra: { scheme: "eleven_proof" } } };
      if (mod97(id) === 1) return { ok: true, data: { extra: { scheme: "mod97" } } };
      return { ok: false, reason: "invalid_checksum" };
    },
  },
];
