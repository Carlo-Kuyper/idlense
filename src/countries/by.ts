/**
 * Belarus — identification number (идентификационный / личный номер) and the
 * taxpayer account number (УНП).
 *
 * BY_ID: 14 characters, `9999999B999BB9` (7 digits, Latin letter, 3 digits,
 * 2 Latin letters, 1 digit), per the Russian Federal Tax Service's sheet on
 * CIS tax identifiers. Printed in passports and on the biometric ID card. Two
 * generations are in circulation and both stay valid:
 *
 * - Before 2012 (first digit 1-6): `G DDMMYY R NNN CC K`.
 *     G       sex and century: 1/2 = 1800s, 3/4 = 1900s, 5/6 = 2000s;
 *             odd male, even female.
 *     DDMMYY  date of birth.
 *     R       region that issued the number (A Minsk city, B Minsk Region,
 *             C Brest, E Vitebsk, H Gomel, K Grodno, M Mogilev).
 *     NNN     sequence among people born that day.
 *     CC      citizenship status; `PB` = citizen of the Republic of Belarus.
 *     K       check digit.
 * - Since 2012 (MVD Resolution No. 345 of 18 October 2011): a random number
 *   7000000-7999999, the letter `A`, a 3-digit sequence, the signature `PB`
 *   and a check digit. Nothing about the holder is encoded.
 *
 * Confidence is low. The pre-2012 layout comes from secondary sources
 * (Belarusian press and forum posts quoting MVD material), not an issuer page
 * we could read; unknown region letters and citizenship codes are passed
 * through, not rejected. Resolution 345 reportedly defines the check digit as
 * mod 10 with repeating weights 7,3,1 and A-Z = 10-35 (the ICAO 9303 scheme),
 * but we could only read it quoted second-hand and the two illustrative
 * numbers we found don't satisfy it, so the check digit is NOT verified
 * (checksum: false). Cyrillic lookalike letters (Р, В, А, ...) are mapped to
 * Latin because people often type the number on a Cyrillic layout.
 *
 * BY_UNP: 9 characters. Individuals' account numbers are 2 Latin capitals +
 * 7 digits; legal entities' and sole traders' are 9 digits (same FNS sheet).
 * The last character is reportedly a check digit, but the algorithm isn't in
 * an official source we could read, so this is a shape check.
 *
 * No upstream library has either.
 */
import { birthFields } from "../core/dates.js";
import { compact } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H", О: "O", Р: "P", С: "C", Т: "T", Х: "X", У: "Y",
  а: "A", в: "B", е: "E", к: "K", м: "M", н: "H", о: "O", р: "P", с: "C", т: "T", х: "X", у: "Y",
};

/** `compact()` after mapping Cyrillic letters that look like Latin ones. */
function normalizeBy(input: string): string {
  return compact(input.replace(/[А-Яа-я]/g, (c) => CYRILLIC_TO_LATIN[c] ?? c));
}

export const BY_REGIONS: Record<string, string> = {
  A: "Minsk",
  B: "Minsk Region",
  C: "Brest Region",
  E: "Vitebsk Region",
  H: "Gomel Region",
  K: "Grodno Region",
  M: "Mogilev Region",
};

export const documents: DocumentSpec[] = [
  {
    code: "BY_ID",
    country: "BY",
    name: "Belarusian Identification Number",
    localName: "Идентификационный номер",
    aliases: ["личный номер", "асабісты нумар", "personal number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [14],
    pattern: /^[1-7]\d{6}[A-Z]\d{3}[A-Z]{2}\d$/,
    example: "3010185A001PB1",
    sources: [
      "https://340fzreport.nalog.ru/html/sites/www.340fzreport.nalog.ru/doc/sng_tin_23122020.pdf",
      "https://mvd.gov.by/uploads/dgim/r345.pdf",
      "https://forum.onliner.by/viewtopic.php?t=895870&start=160",
      "https://gp.by/qa/vopros-otvet/vash-nomer-v-pasporte-.html",
    ],
    normalize: normalizeBy,
    parse(id, { referenceDate }): ParseOutcome {
      const serial = id.slice(8, 11);
      const tail = id.slice(11, 13);
      if (id[0] === "7") {
        if (id[7] !== "A" || tail !== "PB") return { ok: false, reason: "invalid_format" };
        return { ok: true, data: { serial, extra: { scheme: "2012" } } };
      }
      const g = Number(id[0]);
      const year = 1800 + Math.floor((g - 1) / 2) * 100 + Number(id.slice(5, 7));
      const birth = birthFields(year, Number(id.slice(3, 5)), Number(id.slice(1, 3)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      const region = id[7]!;
      const regionName = BY_REGIONS[region];
      return {
        ok: true,
        data: {
          ...birth,
          gender: g % 2 === 1 ? "male" : "female",
          ...(tail === "PB" ? { citizenship: "citizen" } : {}),
          region,
          ...(regionName ? { regionName } : {}),
          serial,
          extra: { scheme: "pre-2012", citizenshipCode: tail },
        },
      };
    },
  },
  {
    code: "BY_UNP",
    country: "BY",
    name: "Belarusian Taxpayer Account Number",
    localName: "Учетный номер плательщика",
    aliases: ["УНП", "UNP", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^(?:[A-Z]{2}\d{7}|\d{9})$/,
    example: "123456789",
    sources: [
      "https://340fzreport.nalog.ru/html/sites/www.340fzreport.nalog.ru/doc/sng_tin_23122020.pdf",
      "https://www.portal.nalog.gov.by/grp/",
    ],
    normalize: normalizeBy,
    parse: (id) => ({
      ok: true,
      data: { extra: { holderType: /^\d/.test(id) ? "entity_or_sole_trader" : "individual" } },
    }),
  },
];
