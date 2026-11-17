/**
 * Norway — fødselsnummer and its variants. 11 digits: DDMMYY III CC.
 *
 * - III individnummer; its last digit is odd for men, even for women.
 * - CC  two mod-11 check digits (weights 3,7,6,1,8,9,4,5,2 and 5,4,3,2,7,6,5,4,3,2).
 * - D-nummer (foreign residents): day + 40.
 * - H-nummer (health assistance number): month + 40.
 * - FH-nummer (health, unknown identity): first digit 8 or 9, no date or gender.
 *
 * Century from the individnummer (Skatteetaten):
 *   000-499 → 1900-1999
 *   500-749 with YY 54-99 → 1854-1899
 *   500-999 with YY 00-39 → 2000-2039
 *   900-999 with YY 40-99 → 1940-1999
 * Any other combination is unissued.
 *
 * Improves on upstream: idnumbers and norwegian-national-id-validator both
 * accept unissued combinations (e.g. 750-899 with YY ≥ 40, read as 20YY) and
 * dates in the future.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ParseContext, ParseOutcome } from "../core/types.js";

const W1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
const W2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function checkDigitsValid(id: string): boolean {
  let k1 = 11 - (weightedSum(id, W1) % 11);
  if (k1 === 11) k1 = 0;
  if (k1 === 10 || k1 !== Number(id[9])) return false;
  let k2 = 11 - (weightedSum(id, W2) % 11);
  if (k2 === 11) k2 = 0;
  return k2 !== 10 && k2 === Number(id[10]);
}

export function norwayCentury(individual: number, yy: number): number | undefined {
  if (individual <= 499) return 1900;
  if (individual <= 749 && yy >= 54) return 1800;
  if (individual >= 500 && yy <= 39) return 2000;
  if (individual >= 900 && yy >= 40) return 1900;
  return undefined;
}

type Kind = "fnr" | "dnr" | "hnr";

function parseDated(id: string, kind: Kind, ctx: ParseContext): ParseOutcome {
  let day = Number(id.slice(0, 2));
  let month = Number(id.slice(2, 4));
  if (kind === "dnr") day -= 40;
  if (kind === "hnr") month -= 40;
  const yy = Number(id.slice(4, 6));
  const individual = Number(id.slice(6, 9));
  const century = norwayCentury(individual, yy);
  if (century === undefined) return { ok: false, reason: "invalid_range" };
  const birth = birthFields(century + yy, month, day, ctx.referenceDate);
  if (!birth) return { ok: false, reason: "invalid_date" };
  if (!checkDigitsValid(id)) return { ok: false, reason: "invalid_checksum" };
  return {
    ok: true,
    data: {
      ...birth,
      gender: Number(id[8]) % 2 === 1 ? "male" : "female",
      serial: id.slice(6, 9),
      extra: {},
    },
  };
}

const common = {
  country: "NO",
  holder: "person",
  checksum: true,
  lengths: [11],
  normalize: digitsOnly,
  format: (c: string) => group(c, [6, 5], " "),
  upstream: ["idnumbers", "nationid", "norwegian-national-id-validator"],
} as const;

const SOURCES = [
  "https://www.skatteetaten.no/en/person/national-registry/identitetsnummer/fodselsnummer/",
  "https://www.skatteetaten.no/en/person/national-registry/identitetsnummer/d-nummer/",
  "https://lovdata.no/dokument/SF/forskrift/2017-07-14-1201",
];

export const documents: DocumentSpec[] = [
  {
    ...common,
    code: "NO_FNR",
    name: "Norwegian National Identity Number",
    localName: "Fødselsnummer",
    aliases: ["FNR", "birth number", "personnummer"],
    purpose: "identity",
    confidence: "high",
    // DD 01-31, MM 01-12
    pattern: /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{7}$/,
    example: "17054026641",
    sources: SOURCES,
    parse: (id, ctx) => parseDated(id, "fnr", ctx),
  },
  {
    ...common,
    code: "NO_DNR",
    name: "Norwegian D-number",
    localName: "D-nummer",
    aliases: ["DNR"],
    purpose: "migratory",
    confidence: "high",
    // DD 41-71
    pattern: /^(4[1-9]|[56]\d|7[01])(0[1-9]|1[0-2])\d{7}$/,
    example: "57054026635",
    sources: SOURCES,
    parse: (id, ctx) => {
      const r = parseDated(id, "dnr", ctx);
      return r.ok ? { ok: true, data: { ...r.data, citizenship: "foreigner" } } : r;
    },
  },
  {
    ...common,
    code: "NO_HNR",
    name: "Norwegian H-number",
    localName: "H-nummer",
    aliases: ["help number"],
    purpose: "health",
    confidence: "moderate",
    // MM 41-52
    pattern: /^(0[1-9]|[12]\d|3[01])(4[1-9]|5[0-2])\d{7}$/,
    example: "17454026624",
    sources: ["https://ehelse.no/standardisering/standarder/identifikatorer-for-personer"],
    parse: (id, ctx) => parseDated(id, "hnr", ctx),
  },
  {
    ...common,
    code: "NO_FHN",
    name: "Norwegian FH-number",
    localName: "Felles hjelpenummer",
    aliases: ["FH-nummer"],
    purpose: "health",
    confidence: "moderate",
    pattern: /^[89]\d{10}$/,
    example: "81234567802",
    sources: ["https://ehelse.no/standardisering/standarder/identifikatorer-for-personer"],
    parse: (id) => (checkDigitsValid(id) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
];
