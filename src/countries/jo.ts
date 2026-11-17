/**
 * Jordan — National Number (الرقم الوطني), 10 digits.
 *
 * The Civil Status and Passports Department doesn't publish the structure or
 * a check digit. Secondary sources suggest the leading digits relate to the
 * birth year and gender, but they disagree, so this is a shape check only
 * (`checksum: false`, low confidence) and nothing is extracted.
 *
 * Ported from personal-identity-validation.
 *
 * Improves on upstream:
 * - personal-identity-validation also requires the first digit to be 1-2 and
 *   digits 3-4 to look like a month (`0[1-9]|[1-9][0-2]`). Neither rule has a
 *   source (the month-like pair rejects 13-19, 23-29, ... in positions 3-4
 *   with no evidence those are unissued), so we don't adopt them. Rejecting
 *   real numbers is worse than a loose shape check on a document identify()
 *   only tries when `includeUnchecked` is set.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "JO_NN",
    country: "JO",
    name: "Jordanian National Number",
    localName: "الرقم الوطني",
    aliases: ["National Number", "NIN", "al-raqam al-watani"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "9861012345",
    sources: ["https://www.cspd.gov.jo/", "https://en.wikipedia.org/wiki/Jordanian_identity_card"],
    upstream: ["personal-identity-validation"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
