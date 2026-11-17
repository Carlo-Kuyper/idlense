/**
 * Poland — PESEL, NIP and REGON.
 *
 * PESEL (ustawa z 24 września 2010 r. o ewidencji ludności, art. 15):
 * 11 digits YYMMDD ZZZX Q.
 * - The month carries the century: 81-92 → 1800s, 01-12 → 1900s,
 *   21-32 → 2000s, 41-52 → 2100s, 61-72 → 2200s.
 * - ZZZX serial; X odd for men, even for women.
 * - Q = (10 - Σ w·d mod 10) mod 10 with weights 1,3,7,9,1,3,7,9,1,3.
 * Foreigners registered in Poland get a PESEL of the same shape.
 *
 * NIP (tax identification number, issued to companies and to individuals
 * running a business): 10 digits; first three are the issuing tax office.
 * Check digit = Σ w·d mod 11 with weights 6,5,7,2,3,4,5,6,7; remainder 10 is
 * never issued.
 *
 * REGON (GUS business register): 9 digits (weights 8,9,2,3,4,5,6,7) or 14
 * digits for local units (weights 2,4,8,5,0,9,7,3,6,1,2,4,8, and the first
 * nine must be a valid REGON). Check = Σ mod 11, 10 → 0.
 *
 * Improves on upstream:
 * - nationid PESEL only checks month/day ranges, so it accepts 30 February,
 *   31 April and birth dates in 2100-2299 (the future).
 * - idnumbers PESEL accepts future birth dates (2100s/2200s and later this
 *   century).
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const PESEL_W = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
const NIP_W = [6, 5, 7, 2, 3, 4, 5, 6, 7];
const REGON9_W = [8, 9, 2, 3, 4, 5, 6, 7];
const REGON14_W = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];

/** Encoded month → [century, real month]. */
export function peselCentury(encodedMonth: number): [number, number] | undefined {
  const block = Math.floor(encodedMonth / 20);
  const month = encodedMonth % 20;
  if (month < 1 || month > 12) return undefined;
  const century = [1900, 2000, 2100, 2200, 1800][block];
  return century === undefined ? undefined : [century, month];
}

const regonCheck = (body: string, w: readonly number[]) => (weightedSum(body, w) % 11) % 10;

export const documents: DocumentSpec[] = [
  {
    code: "PL_PESEL",
    country: "PL",
    name: "Polish National Identification Number",
    localName: "Powszechny Elektroniczny System Ewidencji Ludności",
    aliases: ["PESEL", "numer PESEL"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    // MM 01-12, 21-32, 41-52, 61-72, 81-92; DD 01-31
    pattern: /^\d{2}([02468][1-9]|[13579][0-2])(0[1-9]|[12]\d|3[01])\d{5}$/,
    example: "80010112340",
    sources: [
      "https://www.gov.pl/web/gov/czym-jest-numer-pesel",
      "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20100170087",
      "https://en.wikipedia.org/wiki/PESEL",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const cm = peselCentury(Number(id.slice(2, 4)));
      if (!cm) return { ok: false, reason: "invalid_format" };
      const birth = birthFields(cm[0] + Number(id.slice(0, 2)), cm[1], Number(id.slice(4, 6)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if ((10 - (weightedSum(id, PESEL_W) % 10)) % 10 !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: { ...birth, gender: Number(id[9]) % 2 === 1 ? "male" : "female", serial: id.slice(6, 10), extra: {} },
      };
    },
  },
  {
    code: "PL_NIP",
    country: "PL",
    name: "Polish Tax Identification Number",
    localName: "Numer Identyfikacji Podatkowej",
    aliases: ["NIP", "PL VAT number"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234563218",
    sources: [
      "https://www.podatki.gov.pl/nip/",
      "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19951420702",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 2, 2], "-"),
    parse(id) {
      const r = weightedSum(id, NIP_W) % 11;
      if (r === 10 || r !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { region: id.slice(0, 3), extra: {} } };
    },
  },
  {
    code: "PL_REGON",
    country: "PL",
    name: "Polish Business Register Number",
    localName: "REGON",
    aliases: ["REGON", "Krajowy Rejestr Urzędowy Podmiotów Gospodarki Narodowej"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [9, 14],
    pattern: /^\d{9}(\d{5})?$/,
    example: "123456785",
    sources: ["https://bip.stat.gov.pl/dzialalnosc-statystyki-publicznej/rejestr-regon/", "https://wyszukiwarkaregon.stat.gov.pl/"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse(id) {
      if (regonCheck(id.slice(0, 8), REGON9_W) !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      if (id.length === 14 && regonCheck(id.slice(0, 13), REGON14_W) !== Number(id[13])) {
        return { ok: false, reason: "invalid_checksum" };
      }
      return { ok: true, data: { extra: { localUnit: id.length === 14 } } };
    },
  },
];
