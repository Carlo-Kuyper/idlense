/**
 * Liechtenstein — PEID (Personenidentifikationsnummer), the tax identifier
 * for individuals and entities.
 *
 * Per the Liechtenstein tax administration's TIN sheet on the OECD AEOI
 * portal: digits only, up to 12 long; leading zeros are dropped, so a PEID
 * can be as short as 4 or 7 digits. No check digit and no encoded data are
 * documented, so this is a shape check: 1-12 digits, not starting with 0.
 *
 * No upstream library has it.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "LI_PEID",
    country: "LI",
    name: "Liechtenstein Personal Identification Number",
    localName: "Personenidentifikationsnummer",
    aliases: ["PEID", "PEID-Nummer", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pattern: /^[1-9]\d{0,11}$/,
    example: "123456789012",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/liechtenstein-tin.pdf",
      "https://www.oera.li/cr-portal/suche/suche.xhtml",
    ],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
