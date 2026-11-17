/**
 * United States — federal taxpayer identification numbers and passports.
 * Puerto Rico and the other territories use the same federal numbers.
 *
 * None of the SSA/IRS numbers carries a check digit; validity is structural:
 *
 * - SSN  AAA-GG-SSSS (SSA). Never issued: area 000, 666 or 900-999, group 00,
 *        serial 0000. Since 2011-06-25 areas are assigned at random, so the area
 *        no longer says where it was issued (we don't extract a state).
 * - ITIN 9AA-GG-SSSS (IRS Pub. 4757 / ITIN page): starts with 9 and the 4th-5th
 *        digits are 50-65, 70-88, 90-92 or 94-99. Every ITIN with middle
 *        digits 70-88 has expired (IRS rolling expiry 2017-2020, Form W-7
 *        instructions); they keep a valid shape and can be renewed, so we
 *        accept them and set `extra.expired: true`.
 * - ATIN 9AA-93-SSSS (IRS): adoption taxpayer number, the group 93 that the ITIN
 *        ranges leave out.
 * - EIN  PP-SSSSSSS (IRS): the two-digit prefix must be on the IRS list of
 *        campus prefixes; 00, 07-09, 17-19, 28-29, 49, 69-70, 78-79, 89 and
 *        96-97 are not issued.
 * - Passport: 9 digits, or a letter + 8 digits (Next Generation Passport and
 *        passport card). No check digit on the number.
 *
 * Improves on upstream:
 * - Reserved ranges are reported as `invalid_range` instead of a generic format
 *   error, so callers can tell a typo from a never-issued number.
 * - SSN: rejects the two numbers the SSA publicly voided after mass misuse
 *   (078-05-1120, the Woolworth wallet card, and 219-09-9999, a Social Security
 *   Board pamphlet specimen); idnumbers and nationid accept them.
 * - SSN: idnumbers only accepts the dashed form (`123-45-6789`) and rejects the
 *   same number typed as 9 digits or with spaces.
 * - Adds the ATIN (group 93), which neither upstream has.
 *
 * Ported from nationid (SSN, ITIN, EIN, passport) and idnumbers (SSN).
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

/** IRS "How EINs are assigned and valid EIN prefixes" (all campuses + Internet + SBA). */
const EIN_PREFIX = /^(0[1-6]|1[0-6]|2[0-7]|3\d|4[0-8]|5\d|6[0-8]|7[1-7]|8[0-8]|9[0-58-9])$/;

/** SSA publicly voided these after they were widely misused. */
const SSN_VOIDED = new Set(["078051120", "219099999"]);

const ITIN_GROUP = /^(5\d|6[0-5]|7\d|8[0-8]|9[0-24-9])$/;

const fmt9 = (c: string) => group(c, [3, 2, 4], "-");

const IRS_TIN_SOURCES = [
  "https://www.irs.gov/individuals/individual-taxpayer-identification-number",
  "https://www.eitc.irs.gov/pub/irs-pdf/p4757.pdf",
];

function ssnParse(id: string): ParseOutcome {
  const area = id.slice(0, 3);
  const grp = id.slice(3, 5);
  const serial = id.slice(5);
  if (area === "000" || area === "666" || area[0] === "9") return { ok: false, reason: "invalid_range" };
  if (grp === "00" || serial === "0000") return { ok: false, reason: "invalid_range" };
  if (SSN_VOIDED.has(id)) return { ok: false, reason: "invalid_range" };
  return { ok: true, data: { serial, extra: { area, group: grp } } };
}

export const documents: DocumentSpec[] = [
  {
    code: "US_SSN",
    country: "US",
    name: "United States Social Security Number",
    aliases: ["SSN", "social security number"],
    purpose: "social_security",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456789",
    sources: [
      "https://www.ssa.gov/employer/randomization.html",
      "https://www.ssa.gov/history/ssn/misused.html",
      "https://en.wikipedia.org/wiki/Social_Security_number",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: digitsOnly,
    format: fmt9,
    parse: ssnParse,
  },
  {
    code: "US_ITIN",
    country: "US",
    name: "United States Individual Taxpayer Identification Number",
    aliases: ["ITIN"],
    purpose: "tax",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [9],
    pattern: /^9\d{8}$/,
    example: "912701234",
    sources: [...IRS_TIN_SOURCES, "https://www.irs.gov/pub/irs-prior/iw7--2023.pdf"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: fmt9,
    parse(id) {
      const grp = id.slice(3, 5);
      if (!ITIN_GROUP.test(grp)) return { ok: false, reason: "invalid_range" };
      const extra: Record<string, string | boolean> = { group: grp };
      if (/^(7\d|8[0-8])$/.test(grp)) extra.expired = true;
      return { ok: true, data: { serial: id.slice(5), extra } };
    },
  },
  {
    code: "US_ATIN",
    country: "US",
    name: "United States Adoption Taxpayer Identification Number",
    aliases: ["ATIN"],
    purpose: "tax",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [9],
    pattern: /^9\d{2}93\d{4}$/,
    example: "912931234",
    sources: [
      "https://www.irs.gov/individuals/adoption-taxpayer-identification-number",
      "https://www.eitc.irs.gov/pub/irs-pdf/p4757.pdf",
    ],
    normalize: digitsOnly,
    format: fmt9,
    parse: (id) => ({ ok: true, data: { serial: id.slice(5), extra: {} } }),
  },
  {
    code: "US_EIN",
    country: "US",
    name: "United States Employer Identification Number",
    aliases: ["EIN", "FEIN", "federal tax ID"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456789",
    sources: ["https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [2, 7], "-"),
    parse(id) {
      const prefix = id.slice(0, 2);
      if (!EIN_PREFIX.test(prefix)) return { ok: false, reason: "invalid_range" };
      return { ok: true, data: { serial: id.slice(2), extra: { prefix } } };
    },
  },
  {
    code: "US_PASAPORTE",
    country: "US",
    name: "United States Passport Number",
    aliases: ["US passport", "passport card"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^([A-Z]\d{8}|\d{9})$/,
    example: "A12345678",
    sources: [
      "https://travel.state.gov/content/travel/en/passports/passport-help/next-generation-passport.html",
      "https://en.wikipedia.org/wiki/United_States_passport",
    ],
    upstream: ["nationid"],
    parse: (id) => ({ ok: true, data: { extra: { kind: /^\d/.test(id) ? "legacy" : "next-generation" } } }),
  },
];
