/**
 * Romania — Cod Numeric Personal (CNP) and the fiscal code of legal entities (CUI/CIF).
 *
 * CNP, 13 digits: S AA LL ZZ JJ NNN C
 * - S   sex and century: 1/2 1900-1999, 3/4 1800-1899, 5/6 2000-2099 (odd male,
 *       even female); 7/8 foreign residents (male/female, century not encoded);
 *       9 other foreigners (no sex encoded; used e.g. for fiscal registration).
 * - AALLZZ date of birth.
 * - JJ  county of birth/registration: 01-46 (alphabetical counties, 40 Bucharest,
 *       41-46 Bucharest sectors), 47/48 (abolished Bucharest sectors 7 and 8, numbers
 *       stay valid), 51 Călărași, 52 Giurgiu, 70 "any county" (SII-era single code),
 *       80-83 (listed by independent validators, meaning unpublished; accepted, no name).
 * - NNN 001-999, sequence per issuing point and day.
 * - C   Σ digit·279146358279 mod 11; remainder 10 → 1.
 *
 * Legal basis: Decret 59/1978 art. 30¹; HG 1375/2006 art. 14 (structure, check
 * digit); HG 1251/2006 anexa 3 (7/8 for residents).
 *
 * Improves on upstream (idnumbers):
 * - S = 9 (foreigners) is accepted; idnumbers rejects it.
 * - For 7/8/9 the century isn't encoded: we take the latest past date instead of
 *   idnumbers' fixed "YY < 50 → 20YY", which produced future birth dates.
 * - County 99 is rejected (not in any published table); 47/48, 70 and 80-83 are
 *   accepted. NNN 000 is rejected (sequence starts at 001).
 * - Future birth dates are rejected; dates are never round-tripped through `Date`.
 *
 * RO_VAT (CUI/CIF): 2-10 digits, no leading zero; the last digit is a check digit:
 * body padded left to 9 digits, weights 7,5,3,2,1,7,5,3,2, check = (10·Σ mod 11) mod 10.
 * The `RO` prefix (VAT-registered) is optional on input and dropped.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields, latestPastYear } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** CNP county codes (HG 1375/2006; ro.wikipedia "Cod numeric personal"). */
export const RO_COUNTIES: Record<string, string> = {
  "01": "Alba",
  "02": "Arad",
  "03": "Argeș",
  "04": "Bacău",
  "05": "Bihor",
  "06": "Bistrița-Năsăud",
  "07": "Botoșani",
  "08": "Brașov",
  "09": "Brăila",
  "10": "Buzău",
  "11": "Caraș-Severin",
  "12": "Cluj",
  "13": "Constanța",
  "14": "Covasna",
  "15": "Dâmbovița",
  "16": "Dolj",
  "17": "Galați",
  "18": "Gorj",
  "19": "Harghita",
  "20": "Hunedoara",
  "21": "Ialomița",
  "22": "Iași",
  "23": "Ilfov",
  "24": "Maramureș",
  "25": "Mehedinți",
  "26": "Mureș",
  "27": "Neamț",
  "28": "Olt",
  "29": "Prahova",
  "30": "Satu Mare",
  "31": "Sălaj",
  "32": "Sibiu",
  "33": "Suceava",
  "34": "Teleorman",
  "35": "Timiș",
  "36": "Tulcea",
  "37": "Vaslui",
  "38": "Vâlcea",
  "39": "Vrancea",
  "40": "București",
  "41": "București Sector 1",
  "42": "București Sector 2",
  "43": "București Sector 3",
  "44": "București Sector 4",
  "45": "București Sector 5",
  "46": "București Sector 6",
  "47": "București Sector 7 (abolished)",
  "48": "București Sector 8 (abolished)",
  "51": "Călărași",
  "52": "Giurgiu",
  "70": "Any county",
};
const UNNAMED_COUNTIES = new Set(["80", "81", "82", "83"]);

const CNP_WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

export function cnpCheckDigit(first12: string): number {
  const r = weightedSum(first12, CNP_WEIGHTS) % 11;
  return r === 10 ? 1 : r;
}

const CENTURY: Record<string, number> = { "1": 1900, "2": 1900, "3": 1800, "4": 1800, "5": 2000, "6": 2000 };

const VAT_WEIGHTS = [7, 5, 3, 2, 1, 7, 5, 3, 2];

export function cuiCheckDigit(body: string): number {
  return ((weightedSum(body.padStart(9, "0"), VAT_WEIGHTS) * 10) % 11) % 10;
}

export const documents: DocumentSpec[] = [
  {
    code: "RO_CNP",
    country: "RO",
    name: "Romanian Personal Numeric Code",
    localName: "Cod Numeric Personal",
    aliases: ["CNP", "personal numerical code"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: /^[1-9]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{6}$/,
    example: "1800101221144",
    sources: [
      "https://ro.wikipedia.org/wiki/Cod_numeric_personal_(Rom%C3%A2nia)",
      "https://en.wikipedia.org/wiki/Romanian_identity_card",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const s = id[0]!;
      const yy = Number(id.slice(1, 3));
      const month = Number(id.slice(3, 5));
      const day = Number(id.slice(5, 7));
      const century = CENTURY[s];
      const year = century !== undefined ? century + yy : latestPastYear(yy, month, day, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      const region = id.slice(7, 9);
      const regionName = RO_COUNTIES[region];
      if (!regionName && !UNNAMED_COUNTIES.has(region)) return { ok: false, reason: "invalid_range" };
      const serial = id.slice(9, 12);
      if (serial === "000") return { ok: false, reason: "invalid_range" };
      if (cnpCheckDigit(id) !== Number(id[12])) return { ok: false, reason: "invalid_checksum" };
      const sd = Number(s);
      return {
        ok: true,
        data: {
          ...birth,
          ...(sd === 9 ? {} : { gender: sd % 2 === 1 ? ("male" as const) : ("female" as const) }),
          citizenship: sd <= 6 ? "citizen" : sd <= 8 ? "resident" : "foreigner",
          region,
          ...(regionName ? { regionName } : {}),
          serial,
          extra: {},
        },
      };
    },
  },
  {
    code: "RO_VAT",
    country: "RO",
    name: "Romanian Fiscal Identification Code",
    localName: "Cod de Identificare Fiscală",
    aliases: ["CUI", "CIF", "cod fiscal", "Romanian VAT number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    pattern: /^[1-9]\d{1,9}$/,
    example: "18547290",
    sources: [
      "https://www.anaf.ro/",
      "https://ec.europa.eu/taxation_customs/vies/",
      "https://en.wikipedia.org/wiki/VAT_identification_number",
    ],
    upstream: ["nationid"],
    normalize: (input) => compact(input).replace(/^RO/, ""),
    parse(id) {
      if (cuiCheckDigit(id.slice(0, -1)) !== Number(id[id.length - 1])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
