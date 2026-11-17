/**
 * Lesotho — National Identity Number (NIN) and RSL TIN.
 *
 * LS_NIN, the number on the national identity card issued by the National
 * Identity and Civil Registry (NICR). The National Identity Cards Act, 2011
 * says each register entry gets a unique "National Identity Number" that
 * complies with "prescribed requirements", but the regulations with the format
 * aren't published online. The NICR director's ID4Africa 2015 slides show the
 * layout as `01- 12345678- 17`: 12 digits, grouped 2-8-2. What each group
 * means isn't stated, so we extract nothing.
 *
 * Four NINs quoted in LesLII judgments all have 12 digits, their 11th digit is
 * 2, and their last digit fits a GTIN-style check (weights 1,3,1,3,... over the
 * first 11 digits, complement mod 10). Four samples aren't enough to prove it
 * (and the slide's dummy number fails it), so we don't enforce it. Shape-only,
 * confidence `low`.
 *
 * LS_TIN, the Revenue Services Lesotho taxpayer number, written 123456789-0:
 * nine digits, a hyphen and one more digit. RSL's registration form also has
 * room for older TINs of seven digits, a hyphen and a digit. Whether the last
 * digit is a check digit isn't published. One secondary source, `low`.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "LS_NIN",
    country: "LS",
    name: "Lesotho National Identity Number",
    aliases: ["NIN", "ID number", "national ID", "NICR ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [12],
    pattern: /^\d{12}$/,
    example: "011234567817",
    sources: [
      "https://lesotholii.org/akn/ls/act/2011/9/eng@2011-03-21",
      "https://id4africa.com/2015/presentations/31_Tumelo_Raboletsi.pdf",
      "https://extranet.who.int/cpcd/sites/default/files/public_file_repository/LSO_Lesotho_National-Identity-Cards-Amendment-Act_2022.pdf",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [2, 8, 2], "-"),
    parse(id) {
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "LS_TIN",
    country: "LS",
    name: "Revenue Services Lesotho Taxpayer Identification Number",
    aliases: ["RSL TIN", "LRA TIN", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [8, 10],
    pattern: /^\d{7}(\d{2})?\d$/,
    example: "1234567890",
    sources: ["https://lookuptax.com/validate/lesotho/tin"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, -1)}-${c.slice(-1)}`,
    parse(id) {
      return { ok: true, data: { serial: id.slice(0, -1), extra: { legacy: id.length === 8 } } };
    },
  },
];
