/**
 * Azerbaijan — personal identification number (FİN) and taxpayer number (VÖEN).
 *
 * FİN: 7 letters/digits printed on the ID card and passport, never changed.
 * The State Tax Service notes the letter O is never used (only the digit 0).
 * It encodes nothing and has no check character, so this is shape-only.
 *
 * VÖEN (TIN): 10 digits. Per the State Tax Service: digits 1-2 are the
 * territorial administrative unit, 3-8 a serial number, the 9th is computed by
 * an unpublished algorithm, and the 10th is 1 for legal persons and 2 for
 * natural persons. The check digit can't be verified, so this is shape-only.
 *
 * No upstream library covers Azerbaijan.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const OECD_TIN =
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Azerbaijan-TIN.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "AZ_FIN",
    country: "AZ",
    name: "Azerbaijani Personal Identification Number",
    localName: "Fərdi identifikasiya nömrəsi",
    aliases: ["FİN", "FIN code", "PIN"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [7],
    pattern: /^[0-9A-NP-Z]{7}$/,
    example: "2AB4CD6",
    sources: [OECD_TIN, "https://washington.mfa.gov.az/en/category/passport/ferdi-indentifikasiya-nomresi-fin"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "AZ_VOEN",
    country: "AZ",
    name: "Azerbaijani Taxpayer Identification Number",
    localName: "Vergi ödəyicisinin eyniləşdirmə nömrəsi",
    aliases: ["VÖEN", "VOEN", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{9}[12]$/,
    example: "1234567892",
    sources: [OECD_TIN, "https://www.e-taxes.gov.az/ebyn/payerOrVoenChecker.jsp"],
    normalize: digitsOnly,
    parse: (id) => ({
      ok: true,
      data: {
        region: id.slice(0, 2),
        serial: id.slice(2, 8),
        extra: { holderType: id[9] === "1" ? "legal_entity" : "individual" },
      },
    }),
  },
];
