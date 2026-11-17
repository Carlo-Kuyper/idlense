/**
 * China (mainland).
 *
 * Resident Identity Number (公民身份号码, GB 11643-1999), 18 characters:
 *   AAAAAA YYYYMMDD SSS C
 * - AAAAAA address code (GB/T 2260) of the place of first registration. The
 *          first two digits are the province; we report the 6-digit code as
 *          `region` and the province as `regionName`. 81/82/83 are the
 *          residence permits for Hong Kong, Macao and Taiwan residents (2018).
 * - YYYYMMDD date of birth.
 * - SSS    sequence; odd = male, even = female.
 * - C      ISO 7064 MOD 11-2 check over the first 17 digits; 10 is written X.
 *
 * Legacy 15-digit number (1984-1999 cards): AAAAAA YYMMDD SSS, century 19,
 * no check digit. Still found in old records; kept as a separate,
 * deprecated, unchecked document.
 *
 * Foreigner's Permanent Residence ID Card (2023 version, 外国人永久居留身份证):
 *   9 PP NNN YYYYMMDD SSS C
 * same layout and check as the citizen number, with 9 + the issuing province
 * and the holder's ISO 3166-1 numeric nationality in place of the address code.
 *
 * Unified Social Credit Code (统一社会信用代码, GB 32100-2015), 18 characters
 * from 0-9 and A-Y without I, O, S, V, Z:
 *   R T AAAAAA OOOOOOOOO C
 * registration authority, entity type, address code, organisation code, and
 * a mod-31 check character with weights 3^i mod 31.
 *
 * Improves on upstream (idnumbers):
 * - Address code checked against the province table (unknown provinces →
 *   invalid_range); idnumbers accepts any six digits.
 * - Birth dates before 1800 (year 0001 passes upstream) and future dates
 *   rejected.
 * - Birth date returned as a plain string; idnumbers builds a local `Date`,
 *   which serialises a day early east of UTC.
 * - Adds the legacy 15-digit number, the residence permits for HK/MO/TW
 *   residents, the 2023 foreigner's permanent residence card and the USCC.
 */
import { mod11_2Check } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { group } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

/** GB/T 2260 province-level codes (first two digits of the address code). */
export const CN_PROVINCES: Record<string, string> = {
  "11": "Beijing",
  "12": "Tianjin",
  "13": "Hebei",
  "14": "Shanxi",
  "15": "Inner Mongolia",
  "21": "Liaoning",
  "22": "Jilin",
  "23": "Heilongjiang",
  "31": "Shanghai",
  "32": "Jiangsu",
  "33": "Zhejiang",
  "34": "Anhui",
  "35": "Fujian",
  "36": "Jiangxi",
  "37": "Shandong",
  "41": "Henan",
  "42": "Hubei",
  "43": "Hunan",
  "44": "Guangdong",
  "45": "Guangxi",
  "46": "Hainan",
  "50": "Chongqing",
  "51": "Sichuan",
  "52": "Guizhou",
  "53": "Yunnan",
  "54": "Tibet",
  "61": "Shaanxi",
  "62": "Gansu",
  "63": "Qinghai",
  "64": "Ningxia",
  "65": "Xinjiang",
  "71": "Taiwan",
  "81": "Hong Kong",
  "82": "Macao",
};

/** Residence permits for Hong Kong, Macao and Taiwan residents (address 810000/820000/830000). */
const PERMIT_REGIONS: Record<string, string> = { "81": "Hong Kong", "82": "Macao", "83": "Taiwan" };

const RIC_SOURCES = [
  "https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=080D6FBF2BB468F9007657F26D60013E",
  "https://www.gov.cn/zhengce/content/2018-08/19/content_5314865.htm",
  "https://en.wikipedia.org/wiki/Resident_Identity_Card",
];

const check18 = (id: string) => mod11_2Check(id.slice(0, 17)) === id[17];

function datedParts(id: string, ctx: { referenceDate: Date }) {
  return birthFields(Number(id.slice(6, 10)), Number(id.slice(10, 12)), Number(id.slice(12, 14)), ctx.referenceDate);
}

const DATE8 = "(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])";

// USCC alphabet: digits and A-Y except I, O, S, V, Z (31 symbols).
const USCC_CHARS = "0123456789ABCDEFGHJKLMNPQRTUWXY";
const USCC_WEIGHTS = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];

export function usccCheckChar(body: string): string | undefined {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const v = USCC_CHARS.indexOf(body[i] ?? "");
    if (v < 0) return undefined;
    sum += v * USCC_WEIGHTS[i]!;
  }
  return USCC_CHARS[(31 - (sum % 31)) % 31];
}

export const documents: DocumentSpec[] = [
  {
    code: "CN_RIC",
    country: "CN",
    name: "Chinese Resident Identity Number",
    localName: "公民身份号码",
    aliases: ["居民身份证", "shenfenzheng", "citizen ID number", "resident identity card"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [18],
    pattern: new RegExp(`^[1-8]\\d{5}${DATE8}\\d{3}[\\dX]$`),
    example: "11010519491231002X",
    sources: RIC_SOURCES,
    upstream: ["idnumbers"],
    format: (c) => group(c, [6, 8, 4], " "),
    parse(id, ctx): ParseOutcome {
      const prov = id.slice(0, 2);
      const permit = PERMIT_REGIONS[prov];
      const regionName = permit ?? CN_PROVINCES[prov];
      if (!regionName) return { ok: false, reason: "invalid_range" };
      const birth = datedParts(id, ctx);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (!check18(id)) return { ok: false, reason: "invalid_checksum" };
      const isPermit = permit !== undefined && id.slice(2, 6) === "0000";
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(id[16]) % 2 === 1 ? "male" : "female",
          region: id.slice(0, 6),
          regionName,
          serial: id.slice(14, 17),
          extra: isPermit ? { kind: "hk-mo-tw-residence-permit" } : {},
        },
      };
    },
  },
  {
    code: "CN_RIC15",
    country: "CN",
    name: "Chinese Resident Identity Number (15-digit, pre-1999)",
    localName: "15位身份证号码",
    aliases: ["first-generation ID card", "old shenfenzheng"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    deprecated: true,
    lengths: [15],
    pattern: /^[1-8]\d{7}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}$/,
    example: "110105491231002",
    sources: RIC_SOURCES,
    format: (c) => group(c, [6, 6, 3], " "),
    parse(id, ctx): ParseOutcome {
      const regionName = CN_PROVINCES[id.slice(0, 2)];
      if (!regionName || id.startsWith("81") || id.startsWith("82")) return { ok: false, reason: "invalid_range" };
      // Every 15-digit number was issued to someone born in the 1900s.
      const birth = birthFields(1900 + Number(id.slice(6, 8)), Number(id.slice(8, 10)), Number(id.slice(10, 12)), ctx.referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(id[14]) % 2 === 1 ? "male" : "female",
          region: id.slice(0, 6),
          regionName,
          serial: id.slice(12, 15),
          extra: {},
        },
      };
    },
  },
  {
    code: "CN_FPRID",
    country: "CN",
    name: "Chinese Foreigner's Permanent Residence ID Card Number (2023)",
    localName: "外国人永久居留身份证号码",
    aliases: ["China green card", "五星卡"],
    purpose: "migratory",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [18],
    pattern: new RegExp(`^9[1-6]\\d{4}${DATE8}\\d{3}[\\dX]$`),
    example: "911124197506010016",
    sources: [
      "https://www.nia.gov.cn/n741440/n741567/c1608297/content.html",
      "https://zh.wikipedia.org/wiki/外国人永久居留身份证",
    ],
    format: (c) => group(c, [6, 8, 4], " "),
    parse(id, ctx): ParseOutcome {
      const prov = id.slice(1, 3);
      const regionName = CN_PROVINCES[prov];
      if (!regionName || prov === "71" || prov === "81" || prov === "82") return { ok: false, reason: "invalid_range" };
      const birth = datedParts(id, ctx);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (!check18(id)) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(id[16]) % 2 === 1 ? "male" : "female",
          citizenship: "permanent_resident",
          region: prov,
          regionName,
          serial: id.slice(14, 17),
          extra: { nationality: id.slice(3, 6) },
        },
      };
    },
  },
  {
    code: "CN_USCC",
    country: "CN",
    name: "Chinese Unified Social Credit Code",
    localName: "统一社会信用代码",
    aliases: ["USCC", "USCI", "credit code"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [18],
    // R: registration authority (1-9, A, N, Y); T: type digit; 6-digit address code.
    pattern: /^[1-9ANY][1-9]\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
    example: "91350100M000100Y43",
    sources: [
      "https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=24691C25985C1073D3A7C85629378AC0",
      "https://zh.wikipedia.org/wiki/统一社会信用代码",
    ],
    format: (c) => c,
    parse(id): ParseOutcome {
      if (usccCheckChar(id.slice(0, 17)) !== id[17]) return { ok: false, reason: "invalid_checksum" };
      const regionName = CN_PROVINCES[id.slice(2, 4)];
      return {
        ok: true,
        data: {
          region: id.slice(2, 8),
          ...(regionName ? { regionName } : {}),
          extra: { registrationAuthority: id[0]!, entityType: id[1]!, organizationCode: id.slice(8, 17) },
        },
      };
    },
  },
];
