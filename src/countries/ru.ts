/**
 * Russia — INN (taxpayer number, individuals and organisations), SNILS
 * (pension insurance number) and the internal passport number.
 *
 * INN (Federal Tax Service; OECD TIN sheet): NNNN = code of the tax office that
 * assigned it (first two digits = region), then a serial, then check digits.
 * - Organisations: 10 digits, one check digit (Σ d·(2,4,10,3,5,9,4,6,8) mod 11, mod 10).
 *   Foreign organisations use the prefix 9909.
 * - Individuals: 12 digits, two check digits:
 *   d11 = Σ d·(7,2,4,10,3,5,9,4,6,8) mod 11 mod 10,
 *   d12 = Σ d·(3,7,2,4,10,3,5,9,4,6,8) mod 11 mod 10 (over the first 11 digits).
 *
 * SNILS, 11 digits: XXX-XXX-XXX CC. CC = Σ d·(9..1) over the nine digits;
 * below 100 it is the sum itself, 100 and 101 give 00, above that sum mod 101
 * (with 100 again written 00). Numbers up to 001-001-998 were issued without a
 * check number and are accepted as is.
 *
 * Internal passport, 10 digits: series SS YY (SS = region (OKATO) code,
 * YY = last two digits of the year the blank was printed) + 6-digit number.
 * No check digit.
 *
 * Improves on upstream: idnumbers only has the internal passport (shape
 * only); INN and SNILS are new. The passport rules match idnumbers (series
 * 0000 and number 000000 are rejected).
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const W10 = [2, 4, 10, 3, 5, 9, 4, 6, 8];
const W11 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
const W12 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

const innDigit = (s: string, w: readonly number[]) => (weightedSum(s, w) % 11) % 10;

export function snilsCheck(nine: string): number {
  const sum = weightedSum(nine, [9, 8, 7, 6, 5, 4, 3, 2, 1]);
  if (sum < 100) return sum;
  const r = sum % 101;
  return r === 100 ? 0 : r;
}

const INN_SOURCES = [
  "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/russia-tin.pdf",
  "https://www.nalog.gov.ru/eng/exchinf/inn/",
  "https://ru.wikipedia.org/wiki/Идентификационный_номер_налогоплательщика",
];

export const documents: DocumentSpec[] = [
  {
    code: "RU_INN",
    country: "RU",
    name: "Russian Taxpayer Number (individual)",
    localName: "ИНН (идентификационный номер налогоплательщика)",
    aliases: ["INN", "ИНН", "TIN"],
    purpose: "tax",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [12],
    pattern: /^(?!00)\d{12}$/,
    example: "770112345695",
    sources: INN_SOURCES,
    normalize: digitsOnly,
    parse(id) {
      if (innDigit(id, W11) !== Number(id[10]) || innDigit(id, W12) !== Number(id[11])) {
        return { ok: false, reason: "invalid_checksum" };
      }
      return { ok: true, data: { region: id.slice(0, 2), serial: id.slice(4, 10), extra: { taxOffice: id.slice(0, 4) } } };
    },
  },
  {
    code: "RU_INN_ORG",
    country: "RU",
    name: "Russian Taxpayer Number (organisation)",
    localName: "ИНН юридического лица",
    aliases: ["INN", "ИНН", "TIN"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [10],
    pattern: /^(?!00)\d{10}$/,
    example: "7700123459",
    sources: INN_SOURCES,
    normalize: digitsOnly,
    parse(id) {
      if (innDigit(id, W10) !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          region: id.slice(0, 2),
          serial: id.slice(4, 9),
          extra: { taxOffice: id.slice(0, 4), foreignOrganisation: id.startsWith("9909") },
        },
      };
    },
  },
  {
    code: "RU_SNILS",
    country: "RU",
    name: "Russian Individual Insurance Account Number",
    localName: "СНИЛС (страховой номер индивидуального лицевого счёта)",
    aliases: ["SNILS", "СНИЛС", "pension insurance number"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "12345678964",
    sources: [
      "https://sfr.gov.ru/grazhdanam/snils/",
      "https://ru.wikipedia.org/wiki/Страховой_номер_индивидуального_лицевого_счёта",
    ],
    normalize: digitsOnly,
    format: (c) => `${group(c.slice(0, 9), [3, 3, 3], "-")} ${c.slice(9)}`,
    parse(id) {
      const nine = id.slice(0, 9);
      if (Number(nine) === 0) return { ok: false, reason: "invalid_range" };
      if (Number(nine) <= 1001998) return { ok: true, data: { serial: nine, extra: { checkNumberVerified: false } } };
      if (snilsCheck(nine) !== Number(id.slice(9))) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: nine, extra: { checkNumberVerified: true } } };
    },
  },
  {
    code: "RU_PASSPORT",
    country: "RU",
    name: "Russian Internal Passport Number",
    localName: "Паспорт гражданина РФ (серия и номер)",
    aliases: ["internal passport", "паспорт", "passport series and number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^(?!0000)\d{4}(?!000000)\d{6}$/,
    example: "4509123456",
    sources: ["https://en.wikipedia.org/wiki/Russian_internal_passport", "https://www.gosuslugi.ru/"],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 2)} ${c.slice(2, 4)} ${c.slice(4)}`,
    parse: (id) => ({ ok: true, data: { region: id.slice(0, 2), serial: id.slice(4), extra: { series: id.slice(0, 4), blankYear: id.slice(2, 4) } } }),
  },
];
