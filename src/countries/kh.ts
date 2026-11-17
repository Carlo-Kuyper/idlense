/**
 * Cambodia — General Department of Taxation TIN.
 *
 * Seen as a letter + 3 digits, a hyphen, then 9 digits (e.g. K001-901234567),
 * or the older bare 9 digits. LookupTax cites GDT Notification 38217 for this
 * and says GDT publishes neither the meaning of the prefix letter nor any
 * check digit. Confidence `low`: no GDT document or specimen confirmed it.
 *
 * Not covered: the Khmer national ID card number. Sub-decree No. 47 doesn't
 * give its structure and we found no other source that does.
 */
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "KH_TIN",
    country: "KH",
    name: "Cambodian Taxpayer Identification Number",
    aliases: ["TIN", "VATIN", "GDT TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [9, 13],
    pattern: /^([A-Z]\d{3})?\d{9}$/,
    example: "K001901234567",
    sources: ["https://lookuptax.com/validate/cambodia/vat"],
    format: (c) => (c.length === 13 ? `${c.slice(0, 4)}-${c.slice(4)}` : c),
    parse(id) {
      const extra: Record<string, string> = id.length === 13 ? { prefix: id.slice(0, 4) } : {};
      return { ok: true, data: { serial: id.slice(-9), extra } };
    },
  },
];
