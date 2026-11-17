/**
 * Lebanon — identity card number.
 *
 * Lebanon has no national personal number: the civil "registry number"
 * (رقم السجل) only points at a local civil register. The biometric identity
 * card carries a 12-digit card number (Wikipedia; L'Orient-Le Jour). Wikipedia
 * also says the first digits encode the issue year/month and the issuing
 * office, but cites nothing, so we only check the length. No check digit is
 * known (the 7-3-1 digit on the card belongs to the MRZ). Confidence `low`.
 *
 * Not covered: the Ministry of Finance "financial number" (TIN). The MoF's
 * OECD sheet says it is a numeric serial, optionally followed by -601/-603/
 * -604 for VAT, but gives no length.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "LB_ID",
    country: "LB",
    name: "Lebanese Identity Card Number",
    localName: "رقم بطاقة الهوية",
    aliases: ["ID card number", "بطاقة الهوية", "carte d'identité"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [12],
    pattern: /^\d{12}$/,
    example: "123456789012",
    sources: ["https://en.wikipedia.org/wiki/Lebanese_identity_card", "https://today.lorientlejour.com/article/1408566/"],
    normalize: digitsOnly,
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
];
