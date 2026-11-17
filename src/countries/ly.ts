/**
 * Libya — National Number (الرقم الوطني), 12 digits: S YYYY NNNNNN K.
 *
 * Law No. 8 of 2014 on the National Identification Number, Article 2:
 * - S      sex: 1 male, 2 female.
 * - YYYY   year of birth.
 * - NNNNNN the citizen's sequence number within the birth year, counted
 *          separately for each sex.
 * - K      "used to check the national number". The law doesn't give the
 *          algorithm and we found no published one, so it isn't verified.
 *
 * The structure is in the law, so confidence is `high` for this shape-only
 * rule. Birth years after the reference year are `invalid_date`; so are years
 * before 1900 (the register was built from living citizens in the 2010s).
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "LY_NN",
    country: "LY",
    name: "Libyan National Number",
    localName: "الرقم الوطني",
    aliases: ["National Number", "NID", "al-Raqam al-Watani"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [12],
    pattern: /^[12](19|20)\d{9}$/,
    example: "119900012345",
    sources: ["https://security-legislation.ly/latest-laws/law-no-8-of-2014-on-the-national-id-number/"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const year = Number(id.slice(1, 5));
      if (year < 1900 || year > referenceDate.getFullYear()) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: {
          birthYear: year,
          gender: id[0] === "1" ? "male" : "female",
          serial: id.slice(5, 11),
          extra: { checkDigit: id[11]! },
        },
      };
    },
  },
];
