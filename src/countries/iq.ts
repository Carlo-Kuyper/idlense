/**
 * Iraq — Unified National Card number (البطاقة الوطنية الموحدة), 12 digits.
 *
 * The Ministry of Interior has not published the structure or any check
 * digit, so this is a shape check only (`checksum: false`, low confidence).
 * identify() skips it unless `includeUnchecked` is set.
 *
 * Ported from idnumbers. No fixes: there is no documented rule to improve on.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "IQ_NID",
    country: "IQ",
    name: "Iraqi National Card Number",
    localName: "البطاقة الوطنية",
    aliases: ["Unified National Card", "National Card", "كارتى نيشتمانى"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [12],
    pattern: /^\d{12}$/,
    example: "199012345678",
    sources: ["https://en.wikipedia.org/wiki/Iraqi_National_Card", "https://moi.gov.iq/"],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 4], " "),
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
