/**
 * Guernsey — Social Insurance number and Revenue Service tax reference
 * numbers for entities.
 *
 * Guernsey doesn't issue TINs; for individuals its Social Insurance number is
 * the functional equivalent. The Revenue Service issues it at birth (born in
 * the Bailiwick) or on taking up residence. Per Guernsey's OECD TIN sheet it is
 * GY followed by 6 digits, issued sequentially, with no check character.
 *
 * A small group who moved to Guernsey before 1979 kept a UK National Insurance
 * number or a Jersey social security number, which the same sheet says remain
 * valid Guernsey TINs. Those are validated by GB_NINO / JE_SSN, not here.
 *
 * Confidence `high` for this shape-only rule: the issuer publishes it and it
 * is a fixed prefix plus a sequence.
 *
 * GG_TRN, the Revenue Service's tax reference number, which the same sheet
 * names as the TIN of two kinds of entity:
 * - companies tax resident in Guernsey but not incorporated there: a digit,
 *   one letter and six digits, usually (not always) with a letter suffix,
 *   e.g. `1C 123456 / O`;
 * - partnerships registered outside Guernsey but tax resident there: a digit,
 *   two letters and six digits, with the same optional suffix, e.g.
 *   `1PP 123456 / F`.
 * The sheet doesn't say what the leading digit, letters or suffix mean, and
 * gives no check character, so this is format-only. We report the kind from
 * the letter count. Confidence `high` for the shape, as for GG_SSN: the
 * issuer publishes it.
 *
 * Not modelled (too generic to validate): Guernsey company registration
 * numbers (1-6 digits, sequential), foundation numbers (1-3 digits), charity
 * numbers (`CH` + 1-3 digits) and NPO numbers (`NP` + 1-3 digits). Trusts
 * have no TIN and report `NOTIN`.
 */
import type { DocumentSpec } from "../core/types.js";

const OECD_SHEET =
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Guernsey-TIN.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "GG_SSN",
    country: "GG",
    name: "Guernsey Social Insurance Number",
    aliases: ["social insurance number", "social security number", "GY number"],
    purpose: "social_security",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [8],
    pattern: /^GY\d{6}$/,
    example: "GY123456",
    sources: [OECD_SHEET],
    format: (c) => `${c.slice(0, 2)} ${c.slice(2)}`,
    parse(id) {
      return { ok: true, data: { serial: id.slice(2), extra: {} } };
    },
  },
  {
    code: "GG_TRN",
    country: "GG",
    name: "Guernsey Tax Reference Number (entities)",
    aliases: ["TRN", "tax reference number", "Guernsey tax reference"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "high",
    lengths: [8, 9, 10],
    pattern: /^\d[A-Z]{1,2}\d{6}[A-Z]?$/,
    example: "1C123456O",
    sources: [OECD_SHEET],
    format(c) {
      const m = /^(\d[A-Z]{1,2})(\d{6})([A-Z]?)$/.exec(c)!;
      return m[3] ? `${m[1]} ${m[2]} / ${m[3]}` : `${m[1]} ${m[2]}`;
    },
    parse(id) {
      const m = /^(\d[A-Z]{1,2})(\d{6})([A-Z]?)$/.exec(id)!;
      return {
        ok: true,
        data: {
          serial: m[2]!,
          extra: {
            kind: m[1]!.length === 2 ? "company" : "partnership",
            prefix: m[1]!,
            ...(m[3] ? { suffix: m[3] } : {}),
          },
        },
      };
    },
  },
];
