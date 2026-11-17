/**
 * Malaysia — MyKad / National Registration Identity Card number (NRIC).
 * 12 digits: YYMMDD PB ###G.
 *
 * - YYMMDD date of birth (century not encoded, see below).
 * - PB     place-of-birth code from the birth certificate (JPN tables "Kod
 *          Negeri" and "Kod Negara"): 01-16 and 21-59 are Malaysian states,
 *          82 is "state unknown", 60-68, 71-72, 74-79, 83-93, 98 and 99 are
 *          countries/regions abroad. 00, 17-20, 69, 70, 73, 80, 81 and 94-97
 *          are unassigned and rejected as `invalid_range`.
 * - ###    serial; the first digit is typically 5-7 for people born before
 *          2000 and 0 (sometimes 1-4) for people born from 2000.
 * - G      last digit: odd for men, even for women (JPN convention; a few
 *          clerical errors exist and JPN corrects them on request).
 *
 * There is no check digit.
 *
 * Century: a serial starting with 5-9 means 19YY. Otherwise 20YY when that
 * date is not in the future, else 19YY.
 *
 * Improves on upstream (idnumbers):
 * - Picked 20YY for every serial starting with 0-4, so 800101-01-1234 was
 *   read as born in 2080; we fall back to 19YY when 20YY is in the future.
 * - Built the birth date with `new Date()` (timezone-shifted output).
 * - Labelled every holder born abroad (PB ≥ 60) a non-citizen "resident".
 *   The code is where the holder was born, not citizenship; Malaysians born
 *   abroad get these codes too. We report `extra.bornAbroad` instead.
 * - Didn't extract gender or name the place of birth.
 */
import { birthFields, latestPastYear } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const STATES: Record<string, string> = {
  Johor: "01 21 22 23 24",
  Kedah: "02 25 26 27",
  Kelantan: "03 28 29",
  Melaka: "04 30",
  "Negeri Sembilan": "05 31 59",
  Pahang: "06 32 33",
  "Pulau Pinang": "07 34 35",
  Perak: "08 36 37 38 39",
  Perlis: "09 40",
  Selangor: "10 41 42 43 44",
  Terengganu: "11 45 46",
  Sabah: "12 47 48 49",
  Sarawak: "13 50 51 52 53",
  "Kuala Lumpur": "14 54 55 56 57",
  Labuan: "15 58",
  Putrajaya: "16",
  "Unknown state": "82",
};

const ABROAD: Record<string, string> = {
  "60": "Brunei",
  "61": "Indonesia",
  "62": "Cambodia",
  "63": "Laos",
  "64": "Myanmar",
  "65": "Philippines",
  "66": "Singapore",
  "67": "Thailand",
  "68": "Vietnam",
  "71": "Born abroad (unspecified)",
  "72": "Born abroad (unspecified)",
  "74": "China",
  "75": "India",
  "76": "Pakistan",
  "77": "Saudi Arabia",
  "78": "Sri Lanka",
  "79": "Bangladesh",
  "83": "Asia-Pacific",
  "84": "South America",
  "85": "Africa",
  "86": "Western Europe",
  "87": "United Kingdom / Ireland",
  "88": "Middle East",
  "89": "Far East (Japan, Korea, Taiwan)",
  "90": "Central America / Caribbean",
  "91": "North America",
  "92": "Eastern Europe",
  "93": "Other countries",
  "98": "Stateless",
  "99": "Other (refugee, UN, unspecified nationality)",
};

/** JPN place-of-birth code → name. */
export const MY_PLACE_OF_BIRTH: Record<string, string> = { ...ABROAD };
for (const [name, codes] of Object.entries(STATES)) for (const c of codes.split(" ")) MY_PLACE_OF_BIRTH[c] = name;

export const documents: DocumentSpec[] = [
  {
    code: "MY_NRIC",
    country: "MY",
    name: "Malaysian Identity Card Number",
    localName: "Nombor Kad Pengenalan",
    aliases: ["MyKad", "NRIC", "IC number", "MyKid", "MyPR"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [12],
    pattern: /^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{6}$/,
    example: "800101145013",
    sources: [
      "https://www.jpn.gov.my/my/kod-negeri",
      "https://www.jpn.gov.my/my/kod-negara",
      "https://en.wikipedia.org/wiki/Malaysian_identity_card",
      "https://www.theborneopost.com/2017/11/09/womans-mykad-with-odd-number-for-last-digit-needs-to-be-corrected-immediately-says-voon/",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 2, 4], "-"),
    parse(id, { referenceDate }) {
      const yy = Number(id.slice(0, 2));
      const month = Number(id.slice(2, 4));
      const day = Number(id.slice(4, 6));
      const pb = id.slice(6, 8);
      const regionName = MY_PLACE_OF_BIRTH[pb];
      if (!regionName) return { ok: false, reason: "invalid_range" };
      const serial = id.slice(8, 12);
      const year = Number(serial[0]) >= 5 ? 1900 + yy : latestPastYear(yy, month, day, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(id[11]) % 2 === 1 ? "male" : "female",
          region: pb,
          regionName,
          serial,
          extra: { bornAbroad: Number(pb) >= 60 && pb !== "82" },
        },
      };
    },
  },
];
