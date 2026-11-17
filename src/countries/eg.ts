/**
 * Egypt — National Number (الرقم القومي), 14 digits: C YYMMDD GG SSSS K.
 *
 * - C       century of birth: 2 = 1900s, 3 = 2000s.
 * - YYMMDD  date of birth.
 * - GG      governorate of birth; 88 = born outside Egypt.
 * - SSSS    serial; its last digit is odd for men, even for women.
 * - K       a check digit. The Civil Status Organization has not published
 *           its algorithm and no reproducible spec exists (idnumbers'
 *           research rules out Luhn and found mod-11 guesses unproven), so it
 *           isn't verified (`checksum: false`).
 *
 * Ported from idnumbers.
 *
 * Improves on upstream:
 * - idnumbers accepts birth dates in the future (e.g. 3991231...).
 * - idnumbers returns the birth date as a local-time `Date` (shifts a day when
 *   serialised west of UTC); we return a plain string.
 */
import { birthFields } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Governorate codes (digits 8-9). */
export const EG_GOVERNORATES: Record<string, string> = {
  "01": "Cairo",
  "02": "Alexandria",
  "03": "Port Said",
  "04": "Suez",
  "11": "Damietta",
  "12": "Dakahlia",
  "13": "Sharqia",
  "14": "Qalyubia",
  "15": "Kafr El Sheikh",
  "16": "Gharbia",
  "17": "Monufia",
  "18": "Beheira",
  "19": "Ismailia",
  "21": "Giza",
  "22": "Beni Suef",
  "23": "Faiyum",
  "24": "Minya",
  "25": "Asyut",
  "26": "Sohag",
  "27": "Qena",
  "28": "Aswan",
  "29": "Luxor",
  "31": "Red Sea",
  "32": "New Valley",
  "33": "Matrouh",
  "34": "North Sinai",
  "35": "South Sinai",
  "88": "Born outside Egypt",
};

export const documents: DocumentSpec[] = [
  {
    code: "EG_NID",
    country: "EG",
    name: "Egyptian National ID Number",
    localName: "الرقم القومي",
    aliases: ["National Number", "al-Raqam al-Qawmi", "Egyptian ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [14],
    pattern: /^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[0-38]\d{6}$/,
    example: "29001010100017",
    sources: [
      "https://www.cso.gov.eg/",
      "https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card",
      "https://github.com/identique/idnumbers-npm/blob/main/docs/research/egypt-national-id.md",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const year = (id[0] === "2" ? 1900 : 2000) + Number(id.slice(1, 3));
      const birth = birthFields(year, Number(id.slice(3, 5)), Number(id.slice(5, 7)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      const region = id.slice(7, 9);
      const regionName = EG_GOVERNORATES[region];
      if (!regionName) return { ok: false, reason: "invalid_range" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(id[12]) % 2 === 1 ? "male" : "female",
          region,
          regionName,
          serial: id.slice(9, 13),
          extra: { bornAbroad: region === "88" },
        },
      };
    },
  },
];
