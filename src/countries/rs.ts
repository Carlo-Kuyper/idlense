/**
 * Serbia — Jedinstveni matični broj građana (JMBG), and the shared JMBG
 * engine used by the other former-Yugoslav countries (BA, HR, ME, MK, SI).
 *
 * 13 digits: DD MM YYY RR BBB K.
 * - DDMMYYY date of birth; YYY is the last three digits of the year
 *   (9xx → 19xx, 0xx → 20xx, 8xx → 18xx for the oldest records).
 * - RR      political region of first registration (SFRY Official Gazette
 *           13/78 allocation, table below). People who moved between the
 *           republics before 1991 kept their number, so every republic's
 *           numbers carry codes from the others.
 * - BBB     000-499 male, 500-999 female.
 * - K       m = 11 − (Σ 7,6,5,4,3,2,7,6,5,4,3,2 · digits mod 11); m 1-9 → K = m,
 *           m = 11 → 0. m = 10 (remainder 1): K = 0 per the common rule; Slovenia's
 *           decree says such numbers are never issued, so SI passes `strict`.
 *
 * Unused register codes 20, 40, 90 and 97-99 are rejected as `invalid_range`.
 *
 * Improves on upstream:
 * - idnumbers SRB only accepts region codes 01-09 and 70-99, so it rejects
 *   Serbian citizens registered in another republic before 1991 (e.g. RR 17
 *   Sarajevo), and it accepts the unused codes 90 and 97-99.
 * - idnumbers accepts birth dates in the future (YYY 100-799 read as 2100-2799).
 * - idnumbers' SRB region names are partly wrong (72, 87); ours follow the
 *   1978 allocation as listed on Wikipedia.
 * - Citizenship isn't guessed from the birth republic (idnumbers BA/ME/MK mark
 *   anyone registered elsewhere as "resident"); only codes 01-08 (foreigners)
 *   set `citizenship: "foreigner"`.
 *
 * Ported from idnumbers (MIT).
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, ParseContext, ParseOutcome } from "../core/types.js";

const W = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Region names from the 1978 SFRY allocation (Official Gazette 13/78), via Wikipedia. */
export const JMBG_REGIONS: Record<string, string> = {
  "00": "Naturalized citizen without republic citizenship",
  "01": "Foreigner in Bosnia and Herzegovina",
  "02": "Foreigner in Montenegro",
  "03": "Foreigner in Croatia",
  "04": "Foreigner in Macedonia",
  "05": "Foreigner in Slovenia",
  "06": "Foreigner in Central Serbia",
  "07": "Foreigner in Vojvodina",
  "08": "Foreigner in Kosovo",
  "09": "Naturalized citizen without republic citizenship",
  "10": "Banja Luka",
  "11": "Bihać",
  "12": "Doboj",
  "13": "Goražde",
  "14": "Livno",
  "15": "Mostar",
  "16": "Prijedor",
  "17": "Sarajevo",
  "18": "Tuzla",
  "19": "Zenica",
  "21": "Podgorica, Danilovgrad, Kolašin",
  "22": "Bar, Ulcinj",
  "23": "Budva, Kotor, Tivat",
  "24": "Herceg Novi",
  "25": "Cetinje",
  "26": "Nikšić, Plužine, Šavnik",
  "27": "Berane, Rožaje, Plav, Andrijevica",
  "28": "Bijelo Polje, Mojkovac",
  "29": "Pljevlja, Žabljak",
  "30": "Osijek, Slavonia",
  "31": "Bjelovar, Virovitica, Koprivnica, Pakrac, Podravina",
  "32": "Varaždin, Međimurje",
  "33": "Zagreb",
  "34": "Karlovac, Kordun",
  "35": "Gospić, Lika",
  "36": "Rijeka, Pula, Gorski kotar, Istria, Croatian Littoral",
  "37": "Sisak, Banovina",
  "38": "Split, Zadar, Šibenik, Dubrovnik, Dalmatia",
  "39": "Hrvatsko Zagorje",
  "41": "Bitola",
  "42": "Kumanovo",
  "43": "Ohrid",
  "44": "Prilep",
  "45": "Skopje",
  "46": "Strumica",
  "47": "Tetovo",
  "48": "Veles",
  "49": "Štip",
  "50": "Slovenia",
  "70": "Registered abroad (Serbian diplomatic/consular post)",
  "71": "Belgrade",
  "72": "Šumadija and Pomoravlje",
  "73": "Niš",
  "74": "Southern Morava",
  "75": "Zaječar",
  "76": "Podunavlje",
  "77": "Podrinje and Kolubara",
  "78": "Kraljevo",
  "79": "Užice",
  "80": "Novi Sad",
  "81": "Sombor",
  "82": "Subotica",
  "84": "Kikinda",
  "85": "Zrenjanin",
  "86": "Pančevo",
  "87": "Vršac",
  "88": "Ruma",
  "89": "Sremska Mitrovica",
  "91": "Priština",
  "92": "Kosovska Mitrovica",
  "93": "Peć",
  "94": "Đakovica",
  "95": "Prizren",
  "96": "Gnjilane",
};

/** Republic / province the register code belongs to. */
export function jmbgArea(rr: number): string | undefined {
  if (rr === 0 || rr === 9) return "SFR Yugoslavia";
  if (rr <= 8) return "foreigners";
  if (rr <= 19) return "Bosnia and Herzegovina";
  if (rr >= 21 && rr <= 29) return "Montenegro";
  if (rr >= 30 && rr <= 39) return "Croatia";
  if (rr >= 41 && rr <= 49) return "North Macedonia";
  if (rr >= 50 && rr <= 59) return "Slovenia";
  if (rr >= 60 && rr <= 69) return "temporary residence";
  if (rr >= 70 && rr <= 79) return "Central Serbia";
  if (rr >= 80 && rr <= 89) return "Vojvodina";
  if (rr >= 91 && rr <= 96) return "Kosovo";
  return undefined; // 20, 40, 90, 97-99: never allocated
}

/** Check digit for the first 12 digits; `remainderOne` flags m = 10 (K written as 0). */
export function jmbgCheck(first12: string): { k: number; remainderOne: boolean } {
  const r = weightedSum(first12, W) % 11;
  if (r === 0) return { k: 0, remainderOne: false };
  if (r === 1) return { k: 0, remainderOne: true };
  return { k: 11 - r, remainderOne: false };
}

export function jmbgYear(yyy: number): number {
  return (yyy < 800 ? 2000 : 1000) + yyy;
}

/** Full JMBG/EMŠO parse. `strict` rejects remainder-1 numbers (never issued in Slovenia). */
export function parseJmbg(id: string, ctx: ParseContext, strict = false): ParseOutcome {
  const day = Number(id.slice(0, 2));
  const month = Number(id.slice(2, 4));
  const birth = birthFields(jmbgYear(Number(id.slice(4, 7))), month, day, ctx.referenceDate);
  if (!birth) return { ok: false, reason: "invalid_date" };
  const region = id.slice(7, 9);
  const rr = Number(region);
  const area = jmbgArea(rr);
  if (!area) return { ok: false, reason: "invalid_range" };
  const { k, remainderOne } = jmbgCheck(id);
  if ((strict && remainderOne) || k !== Number(id[12])) return { ok: false, reason: "invalid_checksum" };
  const serial = id.slice(9, 12);
  const regionName = JMBG_REGIONS[region];
  return {
    ok: true,
    data: {
      ...birth,
      gender: Number(serial) < 500 ? "male" : "female",
      ...(rr >= 1 && rr <= 8 ? { citizenship: "foreigner" } : {}),
      region,
      ...(regionName ? { regionName } : {}),
      serial,
      extra: { registerArea: area },
    },
  };
}

export const JMBG_SOURCES = [
  "https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number",
  "https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/1999-01-0345",
] as const;

/** Spec fields shared by every JMBG document. */
export const jmbgCommon = {
  holder: "person",
  purpose: "identity",
  checksum: true,
  lengths: [13],
  // DD 01-31, MM 01-12; year, region and checksum are checked in parse
  pattern: /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{9}$/,
  normalize: digitsOnly,
  upstream: ["idnumbers"],
} as const satisfies Partial<DocumentSpec>;

export const documents: DocumentSpec[] = [
  {
    ...jmbgCommon,
    code: "RS_JMBG",
    country: "RS",
    name: "Serbian Unique Master Citizen Number",
    localName: "Jedinstveni matični broj građana",
    aliases: ["JMBG", "ЈМБГ", "matični broj"],
    confidence: "high",
    example: "0101990710008",
    sources: [
      "https://www.paragraf.rs/propisi/zakon-o-jedinstvenom-maticnom-broju-gradjana.html",
      ...JMBG_SOURCES,
    ],
    parse: (id, ctx) => parseJmbg(id, ctx),
  },
];
