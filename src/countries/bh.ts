/**
 * Bahrain — Personal Number / CPR (الرقم الشخصي), 9 digits: YYMM SSSS C.
 *
 * - YYMM  year and month of birth. The century isn't encoded; we take the
 *         latest century that puts the month in the past.
 * - SSSS  serial.
 * - C     a check digit whose algorithm the Information & eGovernment
 *         Authority has not published, so it isn't verified
 *         (`checksum: false`).
 * Issued to citizens and residents alike.
 *
 * Ported from idnumbers. Same accept/reject behaviour; we additionally
 * extract the birth year and month (idnumbers returns the raw "YYMM").
 */
import { latestPastYear } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "BH_CPR",
    country: "BH",
    name: "Bahraini Personal Number",
    localName: "الرقم الشخصي",
    aliases: ["CPR", "CPR number", "Central Population Register", "Identity card number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^\d{2}(0[1-9]|1[0-2])\d{5}$/,
    example: "800101001",
    sources: [
      "https://www.iga.gov.bh/",
      "https://en.wikipedia.org/wiki/National_identification_number#Bahrain",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const month = Number(id.slice(2, 4));
      const year = latestPastYear(Number(id.slice(0, 2)), month, 1, referenceDate);
      if (year === undefined) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: { birthYear: year, serial: id.slice(4, 8), extra: { birthMonth: month } },
      };
    },
  },
];
