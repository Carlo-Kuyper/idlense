/**
 * Taiwan.
 *
 * National Identification Number (國民身分證統一編號), 10 characters: L G SSSSSSS C
 * - L  letter of the city/county of first household registration. It is
 *      converted to two digits (A=10, B=11, ... with I=34, O=35, W=32, X=30,
 *      Y=31, Z=33 out of sequence).
 * - G  1 male, 2 female.
 * - C  weights 1,9,8,7,6,5,4,3,2,1,1 over the two letter digits and the nine
 *      digits; the sum must be divisible by 10.
 *
 * Resident Certificate / UI number for foreigners and other non-household
 * residents (統一證號), same check:
 * - New format (from 2021-01-02): L G N SSSSSS C where G is 8 (male) or 9
 *   (female) and N is the category: 0-6 foreigner or stateless, 7 national
 *   without household registration, 8 Hong Kong/Macao resident, 9 mainland
 *   resident.
 * - Old format (in use until 2030-12-31): L L SSSSSSS C. The second letter is
 *   A/B (male/female: mainland, HK/Macao residents and nationals without
 *   household registration) or C/D (male/female: foreigners). For the check
 *   it contributes only the units digit of its letter value (A=0, B=1, C=2, D=3).
 *
 * Business Administration Number (統一編號, UBN): 8 digits, weights 1,2,1,2,1,2,4,1;
 * each product's digits are added, and the total must be divisible by 5
 * (10 before the Ministry of Finance relaxed it in 2023; old numbers satisfy
 * both). When the 7th digit is 7 its product 28 counts as 10 or 1, so
 * total + 1 is also accepted.
 *
 * Improves on upstream (idnumbers):
 * - idnumbers only knows the citizen number; we add both UI number formats
 *   (old two-letter and the 2021 8/9 format) and the UBN.
 * - The first letter is mapped to the county/city of registration.
 */
import { digit } from "../core/algorithms.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

/** Letter → two-digit value used in the check. */
const LETTER_VALUE: Record<string, number> = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18, K: 19, L: 20, M: 21,
  N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33,
};

/** County/city of first registration (some merged since 2010 but still on old numbers). */
export const TW_REGIONS: Record<string, string> = {
  A: "Taipei City",
  B: "Taichung City",
  C: "Keelung City",
  D: "Tainan City",
  E: "Kaohsiung City",
  F: "New Taipei City",
  G: "Yilan County",
  H: "Taoyuan",
  I: "Chiayi City",
  J: "Hsinchu County",
  K: "Miaoli County",
  L: "Taichung County",
  M: "Nantou County",
  N: "Changhua County",
  O: "Hsinchu City",
  P: "Yunlin County",
  Q: "Chiayi County",
  R: "Tainan County",
  S: "Kaohsiung County",
  T: "Pingtung County",
  U: "Hualien County",
  V: "Taitung County",
  W: "Kinmen County",
  X: "Penghu County",
  Y: "Yangmingshan",
  Z: "Lienchiang County",
};

/** Check over a 10-char number whose second char is already a digit value `second`. */
function checkValid(id: string, second: number): boolean {
  const lv = LETTER_VALUE[id[0]!]!;
  const nums = [Math.floor(lv / 10), lv % 10, second];
  for (let i = 2; i < 10; i++) nums.push(digit(id, i));
  const w = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += nums[i]! * w[i]!;
  return sum % 10 === 0;
}

export function twCheckDigit(first9: string): number {
  for (let c = 0; c < 10; c++) {
    const id = first9 + c;
    const second = /\d/.test(id[1]!) ? digit(id, 1) : LETTER_VALUE[id[1]!]! % 10;
    if (checkValid(id, second)) return c;
  }
  return -1;
}

const UI_CATEGORY: Record<string, { kind: string; citizenship: string }> = {
  "7": { kind: "national-without-household-registration", citizenship: "citizen" },
  "8": { kind: "hong-kong-macao-resident", citizenship: "hong_kong_macao_resident" },
  "9": { kind: "mainland-resident", citizenship: "mainland_resident" },
};

const NIC_SOURCES = [
  "https://schema.gov.tw/lists/167",
  "https://zh.wikipedia.org/wiki/中華民國國民身分證",
];

export const documents: DocumentSpec[] = [
  {
    code: "TW_NIC",
    country: "TW",
    name: "Taiwan National Identification Number",
    localName: "國民身分證統一編號",
    aliases: ["身分證字號", "ROC ID", "Taiwan ID card number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^[A-Z][12]\d{8}$/,
    example: "A123456789",
    sources: NIC_SOURCES,
    upstream: ["idnumbers"],
    parse(id): ParseOutcome {
      if (!checkValid(id, digit(id, 1))) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          gender: id[1] === "1" ? "male" : "female",
          citizenship: "citizen",
          region: id[0]!,
          regionName: TW_REGIONS[id[0]!]!,
          serial: id.slice(2, 9),
          extra: {},
        },
      };
    },
  },
  {
    code: "TW_ARC",
    country: "TW",
    name: "Taiwan Resident Certificate (UI) Number",
    localName: "統一證號",
    aliases: ["ARC", "UI number", "居留證號碼", "Alien Resident Certificate"],
    purpose: "migratory",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [10],
    pattern: /^[A-Z]([A-D]\d{8}|[89]\d{8})$/,
    example: "A800000014",
    sources: [
      "https://www.immigration.gov.tw/5385/7445/238440/238446/247454/",
      "https://www.immigration.gov.tw/5385/12162/238449/382804/",
      "https://zh.wikipedia.org/wiki/中華民國居留證",
    ],
    parse(id): ParseOutcome {
      const legacy = /[A-D]/.test(id[1]!);
      const second = legacy ? LETTER_VALUE[id[1]!]! % 10 : digit(id, 1);
      if (!checkValid(id, second)) return { ok: false, reason: "invalid_checksum" };
      const male = legacy ? id[1] === "A" || id[1] === "C" : id[1] === "8";
      let kind: string;
      let citizenship: string;
      if (legacy) {
        const foreign = id[1] === "C" || id[1] === "D";
        kind = foreign ? "foreigner" : "mainland-hk-macao-or-national-without-registration";
        citizenship = foreign ? "foreigner" : "resident";
      } else {
        const cat = UI_CATEGORY[id[2]!];
        kind = cat?.kind ?? "foreigner";
        citizenship = cat?.citizenship ?? "foreigner";
      }
      return {
        ok: true,
        data: {
          gender: male ? "male" : "female",
          citizenship,
          region: id[0]!,
          regionName: TW_REGIONS[id[0]!]!,
          serial: legacy ? id.slice(2, 9) : id.slice(3, 9),
          extra: { format: legacy ? "legacy" : "2021", kind },
        },
      };
    },
  },
  {
    code: "TW_UBN",
    country: "TW",
    name: "Taiwan Business Administration Number",
    localName: "統一編號",
    aliases: ["UBN", "統編", "unified business number", "tax ID number"],
    purpose: "tax",
    holder: "entity",
    // Since the 2023 mod-5 change two final digits (d and d±5) pass for every
    // body, so the check is real but not unique.
    checksum: true,
    checkUnique: false,
    confidence: "high",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "12345601",
    sources: [
      "https://www.fia.gov.tw/singlehtml/3?cntId=c4d9cff38c8642ef8872774ee9987283",
      "https://www.fia.gov.tw/singlehtml/3?cntId=4246ca18578e45deaa884285d6863d41",
    ],
    normalize: digitsOnly,
    parse(id): ParseOutcome {
      const w = [1, 2, 1, 2, 1, 2, 4, 1];
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        const p = digit(id, i) * w[i]!;
        sum += Math.floor(p / 10) + (p % 10);
      }
      const ok = sum % 5 === 0 || (id[6] === "7" && (sum + 1) % 5 === 0);
      return ok ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" };
    },
  },
];
