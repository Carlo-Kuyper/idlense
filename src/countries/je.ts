/**
 * Jersey — Social Security number and Revenue Jersey TIN.
 *
 * Jersey runs its own social security and tax systems; residents are issued a
 * TIN and a social security number at birth, not a UK National Insurance number.
 *
 * JE_SSN: two letters, "usually JY", then six digits and a letter, e.g.
 * JY000000A (Government of Jersey CRS guidance and its OECD TIN sheet). We only
 * accept the JY prefix: the other prefixes aren't documented, and accepting any
 * two letters would swallow UK NINOs. The official sources don't restrict the
 * final letter (unlike the UK's A-D), so any letter passes. No check character.
 * Confidence `moderate` because of the undocumented prefixes.
 *
 * JE_TIN: the 10-digit number Revenue Jersey uses to identify individual and
 * company taxpayers, written 100-100-1000. No published structure or check
 * digit. Entities may still use an older form (two letters + up to five
 * digits, e.g. CC00000); that isn't covered here because it's entity-only and
 * the prefixes aren't documented.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const OECD =
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Jersey-TIN.pdf";
const GOV_JE = "https://www.gov.je/TaxesMoney/InternationalTaxAgreements/IGAs/Pages/CommonReportingStandard.aspx";

export const documents: DocumentSpec[] = [
  {
    code: "JE_SSN",
    country: "JE",
    name: "Jersey Social Security Number",
    aliases: ["social security number", "JY number"],
    purpose: "social_security",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^JY\d{6}[A-Z]$/,
    example: "JY000000A",
    sources: [
      OECD,
      GOV_JE,
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Guernsey-TIN.pdf",
    ],
    format: (c) => `${c.slice(0, 2)} ${c.slice(2, 8)} ${c.slice(8)}`,
    parse(id) {
      return { ok: true, data: { serial: id.slice(2, 8), extra: { suffix: id[8]! } } };
    },
  },
  {
    code: "JE_TIN",
    country: "JE",
    name: "Revenue Jersey Taxpayer Identification Number",
    aliases: ["TIN", "tax reference"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1001001000",
    sources: [OECD, GOV_JE],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 3)}-${c.slice(3, 6)}-${c.slice(6)}`,
    parse(id) {
      return { ok: true, data: { serial: id, extra: {} } };
    },
  },
];
