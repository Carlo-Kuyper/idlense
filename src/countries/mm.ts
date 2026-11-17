/**
 * Myanmar — National Registration Card (NRC) number.
 *
 * Written S/TOWNSHIP(T)NNNNNN, e.g. 12/MaBaNa(N)123456 or the same in
 * Burmese script (၁၂/မဘန(နိုင်)၁၂၃၄၅၆):
 * - S        state/region number 1-14.
 * - TOWNSHIP the township abbreviation, three or so syllables, in Latin
 *            transliteration or Burmese letters. The official township table
 *            isn't published, so we accept any letters and don't name it.
 * - T        citizenship class from the 1982 Citizenship Law: N (နိုင်, naing,
 *            citizen), E (ဧည့်, ae, associate citizen), P (ပြု, pyu,
 *            naturalised citizen).
 * - NNNNNN   6-digit serial.
 * No check digit. Confidence `moderate`: consistent secondary sources
 * (python-myanmar, mm-nric) with no official spec. python-myanmar allows
 * state 1-13 only; mm-nric and HR references allow 1-14 (14 is Ayeyarwady),
 * so we accept 14.
 *
 * Normalisation (module-local): spaces dropped, Burmese digits mapped to
 * ASCII, the class word in brackets (Latin or Burmese) mapped to N/E/P, and
 * ASCII uppercased. The slash and brackets are kept: they separate the parts.
 *
 * Not covered: the IRD TIN (no official format found) and the planned
 * Unique ID.
 */
import { upperAscii } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const CLASS: Record<string, string> = { N: "citizen", E: "associate_citizen", P: "naturalized_citizen" };

export function normalizeNrc(input: string): string {
  let s = input.replace(/[\s​-‍⁠﻿]/g, "");
  s = s.replace(/[၀-၉]/g, (c) => String(c.charCodeAt(0) - 0x1040));
  s = s.replace(/[（）]/g, (c) => (c === "（" ? "(" : ")"));
  s = s
    .replace(/\(န[ို]{2}င်?\)/g, "(N)")
    .replace(/\(ဧည[့်]{1,2}\)/g, "(E)")
    .replace(/\(ပြု\)/g, "(P)");
  s = upperAscii(s);
  return s.replace(/\((NAING|AE|PYU)\)/g, (_, w: string) => (w === "NAING" ? "(N)" : w === "AE" ? "(E)" : "(P)"));
}

export const documents: DocumentSpec[] = [
  {
    code: "MM_NRC",
    country: "MM",
    name: "Myanmar National Registration Card Number",
    localName: "နိုင်ငံသားစိစစ်ရေးကတ်ပြား",
    aliases: ["NRC", "NRC number", "national registration card", "CSC", "pink card"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    pattern: /^(1[0-4]|[1-9])\/([A-Z]{3,12}|[က-ဿၐ-႟]{2,12})\([NEP]\)\d{6}$/,
    example: "12/MABANA(N)123456",
    sources: [
      "https://python-myanmar.readthedocs.io/en/stable/_modules/myanmar/nrc.html",
      "https://github.com/Aaronkst/mm-nric",
      "https://qhrm.io/answers/national-registration-card-nrc-role-hiring",
    ],
    normalize: normalizeNrc,
    parse(id) {
      const m = /^(\d+)\/(.+)\(([NEP])\)(\d{6})$/.exec(id)!;
      return {
        ok: true,
        data: {
          citizenship: CLASS[m[3]!]!,
          region: m[1]!,
          serial: m[4]!,
          extra: { township: m[2]!, citizenshipClass: m[3]! },
        },
      };
    },
  },
];
