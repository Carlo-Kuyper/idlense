/**
 * Isle of Man — Income Tax Division Tax Reference Number.
 *
 * Individuals on the island use the National Insurance number, issued by the
 * Isle of Man Income Tax Division or by HMRC in the UK format, so that number
 * is validated by GB_NINO (IM maps to GB in TERRITORY_PARENTS).
 *
 * IM_TRN, the Tax Reference Number issued to individuals, partnerships and
 * entities that file an Isle of Man return: one letter, six digits, then an
 * optional hyphen and two-digit suffix (H111111-11, or C222222 without the
 * suffix). Individual numbers start with H. The OECD sheet is inconsistent
 * about the other letters (its text says companies use X; its examples show a
 * company C333333-33 and a trust X555555-55), so we accept any letter and
 * report it as `extra.prefix`. No check digit. Confidence `moderate`.
 */
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "IM_TRN",
    country: "IM",
    name: "Isle of Man Tax Reference Number",
    aliases: ["tax reference", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [7, 9],
    pattern: /^[A-Z]\d{6}(\d{2})?$/,
    example: "H11111111",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Isle-of-Man-TIN.pdf",
    ],
    format: (c) => (c.length === 9 ? `${c.slice(0, 7)}-${c.slice(7)}` : c),
    parse(id) {
      const extra: Record<string, string> = { prefix: id[0]! };
      if (id.length === 9) extra.suffix = id.slice(7);
      return { ok: true, data: { serial: id.slice(1, 7), extra } };
    },
  },
];
