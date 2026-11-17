/**
 * Bulgaria — ЕГН (uniform civil number), ЛНЧ (foreigner's personal number) and
 * the VAT number (ДДС №, built on the ЕИК/БУЛСТАТ or the owner's ЕГН/ЛНЧ).
 *
 * ЕГН, 10 digits: YY MM DD RRR C
 * - MM month; +20 for births 1800-1899, +40 for births 2000-2099.
 * - RRR birth-region range (historical allocation, 000-925 by oblast, 926-999
 *   other/unknown); its last digit is even for men, odd for women.
 * - C   Σ digit·(2,4,8,5,10,9,7,3,6) mod 11; remainder 10 → 0.
 *
 * ЛНЧ, 10 digits: check digit = Σ digit·(21,19,17,13,11,9,7,3,1) mod 10. No
 * data encoded. The algorithm isn't published by the issuer; it's taken from
 * independent public validators, hence `low` confidence.
 *
 * VAT (ЗДДС чл. 94): `BG` + 9 digits (legal entity: ЕИК/БУЛСТАТ, check digit by
 * weights 1-8 mod 11, retry 3-10 on 10, then 0) or 10 digits (a natural person's
 * ЕГН or ЛНЧ). The prefix is optional on input and dropped.
 *
 * Improves on upstream:
 * - idnumbers' ЕГН check returns 10 for remainder 10 and so rejects every valid
 *   number whose check digit is 0 by that rule.
 * - Adds the birth-region name (idnumbers extracts no region).
 * - Future birth dates are rejected.
 * - nationid's BG_VAT covers only the 9-digit legal-entity form; we also accept
 *   10-digit VAT numbers that are a valid ЕГН or ЛНЧ.
 * - idnumbers' 13-digit ЕИК (branch) check digit is computed over digits 1-4;
 *   no source supports that and we couldn't verify the real rule, so the
 *   13-digit form is left out rather than ported.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome, ParseContext } from "../core/types.js";

/** Upper bound (inclusive) of each region's RRR range, bg.wikipedia "Единен граждански номер". */
const REGIONS: readonly (readonly [number, string])[] = [
  [43, "Благоевград"],
  [93, "Бургас"],
  [139, "Варна"],
  [169, "Велико Търново"],
  [183, "Видин"],
  [217, "Враца"],
  [233, "Габрово"],
  [281, "Кърджали"],
  [301, "Кюстендил"],
  [319, "Ловеч"],
  [341, "Монтана"],
  [377, "Пазарджик"],
  [395, "Перник"],
  [435, "Плевен"],
  [501, "Пловдив"],
  [527, "Разград"],
  [555, "Русе"],
  [575, "Силистра"],
  [601, "Сливен"],
  [623, "Смолян"],
  [721, "София (град)"],
  [751, "София (окръг)"],
  [789, "Стара Загора"],
  [821, "Добрич"],
  [843, "Търговище"],
  [871, "Хасково"],
  [903, "Шумен"],
  [925, "Ямбол"],
  [999, "Друг/неизвестен"],
];

export function egnRegionName(rrr: number): string {
  for (const [max, name] of REGIONS) if (rrr <= max) return name;
  return "Друг/неизвестен";
}

const EGN_W = [2, 4, 8, 5, 10, 9, 7, 3, 6];
export function egnCheckDigit(body: string): number {
  return (weightedSum(body, EGN_W) % 11) % 10;
}

const LNCH_W = [21, 19, 17, 13, 11, 9, 7, 3, 1];
export function lnchCheckDigit(body: string): number {
  return weightedSum(body, LNCH_W) % 10;
}

export function uicCheckDigit(body8: string): number {
  let r = weightedSum(body8, [1, 2, 3, 4, 5, 6, 7, 8]) % 11;
  if (r === 10) r = weightedSum(body8, [3, 4, 5, 6, 7, 8, 9, 10]) % 11;
  return r % 10;
}

const EGN_PATTERN = /^\d{2}(0[1-9]|1[0-2]|2[1-9]|3[0-2]|4[1-9]|5[0-2])(0[1-9]|[12]\d|3[01])\d{4}$/;

function parseEgn(id: string, { referenceDate }: ParseContext): ParseOutcome {
  const yy = Number(id.slice(0, 2));
  let month = Number(id.slice(2, 4));
  const day = Number(id.slice(4, 6));
  let year = 1900 + yy;
  if (month > 40) {
    month -= 40;
    year = 2000 + yy;
  } else if (month > 20) {
    month -= 20;
    year = 1800 + yy;
  }
  const birth = birthFields(year, month, day, referenceDate);
  if (!birth) return { ok: false, reason: "invalid_date" };
  if (egnCheckDigit(id) !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
  const region = id.slice(6, 9);
  return {
    ok: true,
    data: {
      ...birth,
      gender: Number(id[8]) % 2 === 0 ? "male" : "female",
      region,
      regionName: egnRegionName(Number(region)),
      serial: region,
      extra: {},
    },
  };
}

const NRA = "https://nra.bg/";

export const documents: DocumentSpec[] = [
  {
    code: "BG_EGN",
    country: "BG",
    name: "Bulgarian Uniform Civil Number",
    localName: "Единен граждански номер",
    aliases: ["EGN", "ЕГН", "uniform civil number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: EGN_PATTERN,
    example: "8001016243",
    sources: [
      "https://www.grao.bg/",
      "https://bg.wikipedia.org/wiki/%D0%95%D0%B4%D0%B8%D0%BD%D0%B5%D0%BD_%D0%B3%D1%80%D0%B0%D0%B6%D0%B4%D0%B0%D0%BD%D1%81%D0%BA%D0%B8_%D0%BD%D0%BE%D0%BC%D0%B5%D1%80",
      "https://en.wikipedia.org/wiki/National_identification_number#Bulgaria",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse: parseEgn,
  },
  {
    code: "BG_LNCH",
    country: "BG",
    name: "Bulgarian Personal Number of a Foreigner",
    localName: "Личен номер на чужденец",
    aliases: ["LNCh", "ЛНЧ", "PNF"],
    purpose: "migratory",
    holder: "person",
    checksum: true,
    confidence: "low",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1001000004",
    sources: ["https://kik-info.com/spravochnik/proverka-na-egn.php", "https://www.mvr.bg/"],
    normalize: digitsOnly,
    parse(id) {
      if (lnchCheckDigit(id) !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { citizenship: "foreigner", extra: {} } };
    },
  },
  {
    code: "BG_VAT",
    country: "BG",
    name: "Bulgarian VAT Number",
    localName: "Идентификационен номер по ДДС",
    aliases: ["ДДС №", "EIK", "ЕИК", "BULSTAT", "БУЛСТАТ", "UIC"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [9, 10],
    pattern: /^\d{9,10}$/,
    example: "123456786",
    sources: [NRA, "https://ec.europa.eu/taxation_customs/vies/", "https://en.wikipedia.org/wiki/VAT_identification_number"],
    upstream: ["nationid", "idnumbers"],
    normalize: (input) => compact(input).replace(/^BG/, ""),
    parse(id, ctx) {
      if (id.length === 9) {
        if (uicCheckDigit(id) !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
        return { ok: true, data: { extra: { kind: "uic" } } };
      }
      if (EGN_PATTERN.test(id)) {
        const egn = parseEgn(id, ctx);
        if (egn.ok) return { ok: true, data: { extra: { kind: "egn" } } };
      }
      if (lnchCheckDigit(id) === Number(id[9])) return { ok: true, data: { extra: { kind: "lnch" } } };
      return { ok: false, reason: "invalid_checksum" };
    },
  },
];
