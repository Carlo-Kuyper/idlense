/**
 * Nepal — National Identity Number (NIN), issued by the Department of
 * National ID and Civil Registration (DoNIDCR) under the National Identity
 * Card and Registration Act 2076 (2019). Since March 2024 it is also
 * assigned at birth registration.
 *
 * The NIN is 10 digits with no published structure or check digit, so this
 * is a shape check only (`checksum: false`, low confidence). Don't confuse it
 * with the 16-digit enrolment/application number.
 *
 * Ported from idnumbers (NPL).
 *
 * Improves on upstream: idnumbers expects 11 digits and cites Nigeria's
 * NIMC page (Nigeria's NIN is 11 digits); Nepal's NIN is 10.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "NP_NIN",
    country: "NP",
    name: "Nepal National Identity Number",
    localName: "राष्ट्रिय परिचय नम्बर",
    aliases: ["NIN", "NID", "Rastriya Parichaya Patra"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234567890",
    sources: [
      "https://donidcr.gov.np/",
      "https://lawalpine.com/blog/national-id-registration-in-nepal",
      "https://myrepublica.nagariknetwork.com/news/national-identification-number-to-be-provided-at-time-of-birth-registration",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
