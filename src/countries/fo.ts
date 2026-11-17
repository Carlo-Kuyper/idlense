/**
 * Faroe Islands — P-tal (Faroese personal number).
 *
 * The Faroes run their own civil registration (the National Registration
 * Office, under the Faroese Civil Registration System Act 41/2007); residents
 * hold a P-tal, not a Danish CPR number. The Faroese TIN for individuals is the
 * P-tal.
 *
 * Structure, per the Faroese submission to the OECD and TAKS:
 *   DDMMYY-XXX, 9 digits, often written with a hyphen after the 6th digit.
 * - DDMMYY  date of birth. The century is not encoded, so we pick the latest
 *           century that gives a past date.
 * - XXX     the last digit is a check digit and also the gender: odd = male,
 *           even = female. The check-digit algorithm is not published, so we
 *           don't verify it (checksum: false).
 *
 * Non-residents who are taxable in the Faroes get an "Identification number"
 * from TAKS whose structure is "similar, but not identical" to the P-tal. Its
 * format isn't published, so it isn't covered here.
 *
 * Confidence `high` for this shape-only rule: two issuer sources agree.
 */
import { birthFields, latestPastYear } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "FO_PTAL",
    country: "FO",
    name: "Faroese Personal Identification Number",
    localName: "P-tal",
    aliases: ["P number", "P-number", "Faroese P Number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [9],
    pattern: /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{5}$/,
    example: "150385124",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Faroe-Islands-TIN.pdf",
      "https://www.taks.fo/en/individuals/tax/p-tal",
    ],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 6)}-${c.slice(6)}`,
    parse(id, { referenceDate }) {
      const d = Number(id.slice(0, 2));
      const m = Number(id.slice(2, 4));
      const year = latestPastYear(Number(id.slice(4, 6)), m, d, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, m, d, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: { ...birth, gender: Number(id[8]) % 2 === 1 ? "male" : "female", serial: id.slice(6), extra: {} },
      };
    },
  },
];
