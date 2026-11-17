/**
 * Canada — Social Insurance Number, Business Number and passport.
 *
 * - SIN  9 digits, Luhn over all 9 (Service Canada). The first digit is the
 *        region where the number was registered:
 *          1 Atlantic provinces (and some newer Ontario SINs), 2-3 Quebec,
 *          4-5 Ontario, 6 Prairies/NWT/Nunavut/Northwestern Ontario,
 *          7 British Columbia/Yukon, 9 temporary residents (not citizens or
 *          permanent residents; the SIN expires with the permit).
 *          0 is used by the CRA for individual/temporary/adoption tax numbers
 *          and 8 only for business numbers; neither is a SIN.
 * - BN   9-digit root, optionally followed by a two-letter program identifier
 *        and a 4-digit reference (`123456789RT0001`). The CRA doesn't publish a
 *        check-digit rule for the root, so it's shape-only.
 * - Passport: 2 letters + 6 digits; no check digit on the printed number.
 *
 * Improves on upstream:
 * - SIN: nationid accepts first digits 0 and 8, which are CRA tax numbers and
 *   business numbers, not SINs. We report them as `invalid_range`.
 * - SIN: extracts the registration region and flags 9xx numbers as
 *   `citizenship: "temporary_resident"`.
 *
 * Ported from nationid (SIN, BN, passport) and idnumbers (SIN).
 */
import { luhnValid } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** First digit of a SIN → region of registration (Wikipedia, "Geography"). */
export const CA_SIN_REGIONS: Record<string, string> = {
  "1": "Atlantic provinces (NB, NS, PE, NL)",
  "2": "Quebec",
  "3": "Quebec",
  "4": "Ontario",
  "5": "Ontario",
  "6": "Prairies, Northwest Territories, Nunavut",
  "7": "British Columbia, Yukon",
};

export const documents: DocumentSpec[] = [
  {
    code: "CA_SIN",
    country: "CA",
    name: "Canadian Social Insurance Number",
    localName: "Numéro d'assurance sociale",
    aliases: ["SIN", "NAS"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456782",
    sources: [
      "https://www.canada.ca/en/employment-social-development/services/sin.html",
      "https://en.wikipedia.org/wiki/Social_insurance_number",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], " "),
    parse(id) {
      const first = id[0]!;
      if (first === "0" || first === "8") return { ok: false, reason: "invalid_range" };
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      if (first === "9") {
        return { ok: true, data: { citizenship: "temporary_resident", region: first, extra: { temporary: true } } };
      }
      return { ok: true, data: { region: first, regionName: CA_SIN_REGIONS[first], extra: { temporary: false } } };
    },
  },
  {
    code: "CA_BN",
    country: "CA",
    name: "Canadian Business Number",
    localName: "Numéro d'entreprise",
    aliases: ["BN", "BN9", "BN15", "GST/HST number", "NE"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "low",
    lengths: [9, 15],
    pattern: /^\d{9}((RT|RP|RC|RM|RR|RZ)\d{4})?$/,
    example: "123456789RT0001",
    sources: [
      "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/business-registration/business-number-program-account.html",
      "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/you-need-a-business-number-a-program-account.html",
    ],
    upstream: ["nationid"],
    format: (c) => (c.length === 9 ? c : `${c.slice(0, 9)} ${c.slice(9)}`),
    parse(id) {
      const extra: Record<string, string> = { root: id.slice(0, 9) };
      if (id.length === 15) {
        extra.programId = id.slice(9, 11);
        extra.reference = id.slice(11);
      }
      return { ok: true, data: { extra } };
    },
  },
  {
    code: "CA_PASAPORTE",
    country: "CA",
    name: "Canadian Passport Number",
    aliases: ["Canadian passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [8],
    pattern: /^[A-Z]{2}\d{6}$/,
    example: "AB123456",
    sources: [
      "https://en.wikipedia.org/wiki/Canadian_passport",
      "https://learn.microsoft.com/en-us/purview/sit-defn-canada-passport-number",
    ],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
