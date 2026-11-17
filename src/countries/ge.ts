/**
 * Georgia — personal number and taxpayer identification code.
 *
 * Per the Revenue Service's OECD TIN sheet:
 * - Citizens (incl. individual entrepreneurs) use the 11-digit personal number
 *   from the national ID card, assigned by the Public Service Development
 *   Agency. No check digit or encoded data is published.
 * - Entities, and foreign individuals registered by the Revenue Service, get a
 *   9-digit identification code: a legal-form code plus a seven-digit serial.
 *   Codes 1 and 3: physical persons / individual entrepreneurs (foreigners);
 *   2 and 4: enterprises and other legal persons. No check digit is published.
 *
 * Both are shape-only (`checksum: false`).
 *
 * Improves on upstream: idnumbers' "personal number" for Georgia is 9 digits,
 * which is the identification code above, not the citizens' 11-digit personal
 * number. We model both, and restrict the 9-digit code to legal-form codes 1-4.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const SOURCES = [
  "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/georgia-tin.pdf",
  "https://www.rs.ge/5385",
];

export const documents: DocumentSpec[] = [
  {
    code: "GE_PN",
    country: "GE",
    name: "Georgian Personal Number",
    localName: "პირადი ნომერი",
    aliases: ["personal number", "piradi nomeri", "PN"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "01001012345",
    sources: [...SOURCES, "https://en.wikipedia.org/wiki/National_identification_number#Georgia"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "GE_TIN",
    country: "GE",
    name: "Georgian Taxpayer Identification Code",
    localName: "საიდენტიფიკაციო კოდი",
    aliases: ["identification code", "TIN", "company ID"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    // first digit = legal-form code 1-4
    pattern: /^[1-4]\d{8}$/,
    example: "204123456",
    sources: SOURCES,
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id) {
      const form = id[0]!;
      return {
        ok: true,
        data: { extra: { legalFormCode: form, legalForm: form === "1" || form === "3" ? "individual" : "legal_entity" } },
      };
    },
  },
];
