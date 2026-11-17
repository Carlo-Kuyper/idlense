/**
 * Zimbabwe — national registration number, 11-12 characters:
 * RR NNNNNN(N) L DD (written e.g. 63-123456 B 02).
 *
 * - RR        code of the registration office that issued the number.
 * - NNNNNN(N) 6- or 7-digit sequence.
 * - L         check letter: the integer RR+NNNNNN(N) mod 23, mapped through
 *             Z A B C D E F G H J K L M N P Q R S T V W X Y (no I, O, U).
 * - DD        district of origin; 00 for foreign nationals.
 * The registrar doesn't publish the scheme. The check-letter rule is from the
 * Pachedu voters'-roll analysis (2018, appendix 2) and reproduces the letters
 * of the published sample IDs cited in identique/idnumbers#315.
 *
 * Compact form keeps the printed order: `63-123456 B 02` → `63123456B02`.
 * The check letter is third from the end (`checkIndex: -3`); the district
 * after it isn't covered by the check.
 *
 * Ported from idnumbers (structure, district list, letter table).
 *
 * Improves on upstream:
 * - idnumbers takes the *digit sum* mod 23 instead of the number itself, so it
 *   rejects most real IDs and accepts wrong letters; its own example
 *   63123456G02 has the wrong letter (should be B). Reported upstream as
 *   identique/idnumbers#315 and idnumbers-npm#287.
 * - Lower-case letters are accepted.
 * - We extract the district and foreigner status (district 00).
 */
import type { DocumentSpec } from "../core/types.js";

export const ZW_CHECK_LETTERS = "ZABCDEFGHJKLMNPQRSTVWXY";

/** Registration-office / district codes known to be issued (idnumbers' table, from the same report). */
export const ZW_DISTRICTS = new Set(
  (
    "02 03 04 05 06 07 08 10 11 12 13 14 15 18 19 21 22 23 24 25 26 27 28 29 32 34 35 37 38 39 41 42 43 44 45 46 " +
    "47 48 49 50 53 54 56 58 59 61 63 66 67 68 70 71 73 75 77 79 80 83 84 85 86"
  ).split(" "),
);

/** Check letter for RR + NNNNNN(N). At most 9 digits, so `Number` is exact. */
export function zwCheckLetter(digits: string): string {
  return ZW_CHECK_LETTERS[Number(digits) % 23]!;
}

export const documents: DocumentSpec[] = [
  {
    code: "ZW_NID",
    country: "ZW",
    name: "Zimbabwean National Registration Number",
    aliases: ["Zimbabwe ID", "national ID", "national registration number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    checkIndex: -3,
    confidence: "moderate",
    lengths: [11, 12],
    pattern: /^\d{8,9}[A-HJ-NP-TV-Z]\d{2}$/,
    example: "63123456B02",
    sources: [
      "https://www.slideshare.net/slideshow/zimbabwe-2018-biometric-voters-roll-analysis-pachedu/106248017",
      "https://github.com/identique/idnumbers/issues/315",
      "https://trueidzim.com/articles/zimbabwe-id-number-explained",
      "https://en.wikipedia.org/wiki/National_identification_number#Zimbabwe",
    ],
    upstream: ["idnumbers"],
    format: (c) => `${c.slice(0, 2)}-${c.slice(2, -3)} ${c.slice(-3, -2)} ${c.slice(-2)}`,
    parse(id) {
      const digits = id.slice(0, -3);
      const letter = id[id.length - 3]!;
      const district = id.slice(-2);
      const office = id.slice(0, 2);
      if (!ZW_DISTRICTS.has(office)) return { ok: false, reason: "invalid_range" };
      if (district !== "00" && !ZW_DISTRICTS.has(district)) return { ok: false, reason: "invalid_range" };
      if (zwCheckLetter(digits) !== letter) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          ...(district === "00" ? { citizenship: "foreigner" } : {}),
          region: district,
          serial: digits.slice(2),
          extra: { registrationOffice: office, checkLetter: letter },
        },
      };
    },
  },
];
