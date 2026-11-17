/**
 * South Korea — Resident Registration Number (주민등록번호), Foreign Registration
 * Number (외국인등록번호) and Business Registration Number (사업자등록번호).
 *
 * RRN / FRN: 13 digits, YYMMDD-GXXXXXX.
 * - YYMMDD date of birth.
 * - G      century, sex and nationality:
 *            9 male / 0 female       1800-1899
 *            1 male / 2 female       1900-1999
 *            3 male / 4 female       2000-2099
 *            5 male / 6 female       1900-1999, foreigner
 *            7 male / 8 female       2000-2099, foreigner
 * - Before October 2020 the remaining six digits were BBBB N C: BBBB the
 *   registration office (first two digits the region), N a serial and C a check
 *   digit, C = (11 − Σ wᵢ·dᵢ mod 11) mod 10 with weights 2,3,4,5,6,7,8,9,2,3,4,5.
 *   Since October 2020 (amended Enforcement Decree of the Resident Registration Act)
 *   they are random, for new numbers AND for changed numbers. A number can't tell
 *   when it was assigned, so `KR_RRN` / `KR_FRN` check the shape and date only
 *   (`checksum: false`) and report the old check digit in `extra.legacyChecksumValid`.
 *   `KR_RRN_LEGACY` (deprecated) is the pre-2020 rule with the check digit enforced.
 *   Foreigner numbers are not covered by the legacy document: their pre-2020 check
 *   digit rule isn't published.
 *
 * BRN: 10 digits, XXX-XX-XXXXX. Digits 4-5 classify the taxpayer (81, 86, 87, 88
 * for-profit company head office, 85 branch, 82 non-profit, 83 state/local
 * government, 84 foreign company, 01-79 / 90-99 individual businesses, 80/89
 * other). The 10th digit is a check digit: weights 1,3,7,1,3,7,1,3,5 over digits
 * 1-9, plus ⌊d9·5/10⌋, check = (10 − sum mod 10) mod 10. The National Tax Service
 * doesn't publish the formula; it is the long-standing public one and holds for
 * published company numbers (e.g. 124-81-00998).
 *
 * Improves on upstream (idnumbers):
 * - Accepts the compact 13-digit form; idnumbers requires the dash.
 * - Rejects future birth dates (idnumbers accepts e.g. 270101-3xxxxxx today).
 * - Birth date is a plain string; idnumbers builds a local `Date`, which shifts the
 *   day when serialised in a timezone east of UTC.
 * - Foreigners (G 5-8) are their own document with `citizenship: "foreigner"`;
 *   idnumbers labels them "resident".
 * - The old-format check (idnumbers `OldResidentRegistration`) also applied to
 *   foreigners, whose check digit followed a different, unpublished rule.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ParseContext, ParseOutcome } from "../core/types.js";

const RRN_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];

export function rrnLegacyCheckDigit(first12: string): number {
  return (11 - (weightedSum(first12, RRN_WEIGHTS) % 11)) % 10;
}

const CENTURY: Record<string, number> = {
  "9": 1800, "0": 1800, "1": 1900, "2": 1900, "3": 2000, "4": 2000,
  "5": 1900, "6": 1900, "7": 2000, "8": 2000,
};

function parseRrn(id: string, ctx: ParseContext, legacy: boolean): ParseOutcome {
  const g = id[6]!;
  const century = CENTURY[g]!;
  const birth = birthFields(century + Number(id.slice(0, 2)), Number(id.slice(2, 4)), Number(id.slice(4, 6)), ctx.referenceDate);
  if (!birth) return { ok: false, reason: "invalid_date" };
  const checkOk = rrnLegacyCheckDigit(id.slice(0, 12)) === Number(id[12]);
  if (legacy && !checkOk) return { ok: false, reason: "invalid_checksum" };
  // Odd G is male, even is female, including 9/0 for the 1800s.
  const gender = Number(g) % 2 === 1 ? "male" : "female";
  const foreign = g >= "5" && g <= "8";
  return {
    ok: true,
    data: {
      ...birth,
      gender,
      citizenship: foreign ? "foreigner" : "citizen",
      ...(legacy ? { region: id.slice(7, 9), serial: id[11]! } : {}),
      extra: legacy ? { registrationOffice: id.slice(7, 11) } : { legacyChecksumValid: checkOk },
    },
  };
}

const DATE = "\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])";
const SOURCES = [
  "https://www.law.go.kr/lsSc.do?query=%EC%A3%BC%EB%AF%BC%EB%93%B1%EB%A1%9D%EB%B2%95%20%EC%8B%9C%ED%96%89%EB%A0%B9",
  "https://www.mois.go.kr/",
  "https://en.wikipedia.org/wiki/Resident_registration_number",
];

const rrnCommon = {
  country: "KR",
  holder: "person",
  lengths: [13],
  normalize: digitsOnly,
  format: (c: string) => group(c, [6, 7], "-"),
  upstream: ["idnumbers"],
} as const;

export const documents: DocumentSpec[] = [
  {
    ...rrnCommon,
    code: "KR_RRN",
    name: "South Korean Resident Registration Number",
    localName: "주민등록번호",
    aliases: ["RRN", "jumin deungnok beonho", "jumin beonho"],
    purpose: "identity",
    checksum: false,
    confidence: "high",
    pattern: new RegExp(`^${DATE}[0-49]\\d{6}$`),
    example: "8001011234560",
    sources: SOURCES,
    parse: (id, ctx) => parseRrn(id, ctx, false),
  },
  {
    ...rrnCommon,
    code: "KR_FRN",
    name: "South Korean Foreign Registration Number",
    localName: "외국인등록번호",
    aliases: ["ARC number", "alien registration number", "foreigner RRN"],
    purpose: "migratory",
    checksum: false,
    confidence: "high",
    pattern: new RegExp(`^${DATE}[5-8]\\d{6}$`),
    example: "8001015123456",
    sources: [
      "https://www.hikorea.go.kr/",
      "https://en.wikipedia.org/wiki/Resident_registration_number",
    ],
    parse: (id, ctx) => parseRrn(id, ctx, false),
  },
  {
    ...rrnCommon,
    code: "KR_RRN_LEGACY",
    name: "South Korean Resident Registration Number (pre-October 2020)",
    localName: "주민등록번호",
    aliases: ["old RRN"],
    purpose: "identity",
    deprecated: true,
    checksum: true,
    confidence: "moderate",
    pattern: new RegExp(`^${DATE}[0-49]\\d{6}$`),
    example: "8001011234560",
    sources: SOURCES,
    parse: (id, ctx) => parseRrn(id, ctx, true),
  },
  {
    code: "KR_BRN",
    country: "KR",
    name: "South Korean Business Registration Number",
    localName: "사업자등록번호",
    aliases: ["BRN", "business number", "saeopja deungnok beonho"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [10],
    pattern: /^[0-9]{10}$/,
    example: "1018112341",
    sources: [
      "https://www.nts.go.kr/",
      "https://www.law.go.kr/lsSc.do?query=%EB%B6%80%EA%B0%80%EA%B0%80%EC%B9%98%EC%84%B8%EB%B2%95%20%EC%8B%9C%ED%96%89%EA%B7%9C%EC%B9%99",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 2, 5], "-"),
    parse(id) {
      const d8 = id.charCodeAt(8) - 48;
      const sum = weightedSum(id, [1, 3, 7, 1, 3, 7, 1, 3, 5]) + Math.floor((d8 * 5) / 10);
      if ((10 - (sum % 10)) % 10 !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
      const type = id.slice(3, 5);
      const t = Number(type);
      return {
        ok: true,
        data: {
          serial: id.slice(5, 9),
          extra: { typeCode: type, corporation: t >= 81 && t <= 88, taxOffice: id.slice(0, 3) },
        },
      };
    },
  },
];
