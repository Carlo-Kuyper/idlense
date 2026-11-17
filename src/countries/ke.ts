/**
 * Kenya — KRA PIN (Personal Identification Number), the tax number the Kenya
 * Revenue Authority issues to people and organisations. 11 characters:
 * L DDDDDDDDD L.
 *
 * - First letter: A for individuals, P for non-individuals (companies,
 *   partnerships, trusts, clubs).
 * - Nine digits.
 * - A final letter. It is usually described as a check character, but KRA
 *   doesn't publish how it is derived, so we don't verify it.
 *
 * Shape-only. Independent secondary sources (python-stdnum's documentation,
 * LookupTax) agree on the layout and cite KRA's PIN pages, so confidence is
 * `moderate`.
 *
 * KE_ID, the national ID card number: a plain serial with no documented
 * structure, so it is modelled shape-only. Smile ID's
 * API docs require the National ID number to match /^[0-9]{1,9}$/, and
 * Dojah's examples use 8 and 9 digits. Nothing is encoded in it and there's
 * no check digit, so we only check the length and reject an all-zero number.
 * Confidence `low`; this mostly helps when the caller already knows the
 * number is Kenyan.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "KE_PIN",
    country: "KE",
    name: "Kenya Revenue Authority PIN",
    localName: "KRA PIN",
    aliases: ["KRA PIN", "PIN", "TIN", "iTax PIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [11],
    pattern: /^[AP]\d{9}[A-Z]$/,
    example: "A123456789Z",
    sources: [
      "https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/about-pin",
      "https://arthurdejong.org/python-stdnum/doc/2.0/stdnum.ke.pin",
      "https://lookuptax.com/docs/tax-identification-number/kenya-tax-id-guide",
    ],
    parse(id) {
      return {
        ok: true,
        data: {
          serial: id.slice(1, 10),
          extra: { taxpayerType: id[0] === "A" ? "individual" : "non_individual" },
        },
      };
    },
  },
  {
    code: "KE_ID",
    country: "KE",
    name: "Kenyan National Identity Card Number",
    aliases: ["national ID", "ID number", "IPRS ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    pattern: /^\d{1,9}$/,
    example: "123456789",
    sources: [
      "https://docs.usesmileid.com/id-coverage/verify-with-id-number/kenya",
      "https://docs.dojah.io/api-reference/individual-verification/kenya/national-id.md",
    ],
    normalize: digitsOnly,
    parse(id) {
      if (/^0+$/.test(id)) return { ok: false, reason: "invalid_range" };
      return { ok: true, data: { serial: id, citizenship: "citizen", extra: {} } };
    },
  },
];
