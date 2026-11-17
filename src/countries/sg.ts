/**
 * Singapore — NRIC, FIN, UEN and IRAS tax reference numbers.
 *
 * NRIC / FIN: 9 characters, prefix letter + 7 digits + check letter.
 * - S: citizens and permanent residents registered before 2000.
 * - T: citizens and permanent residents registered from 2000.
 * - F: foreigners (FIN) issued before 2000.
 * - G: FIN issued 2000-2021.
 * - M: FIN issued from 1 January 2022 (ICA's M-series).
 * Check letter: Σ digit·(2,7,6,5,4,3,2), plus a prefix offset (S/F 0, T/G 4,
 * M 3), mod 11, indexed into "JZIHGFEDCBA" (S/T), "XWUTRQPNMLK" (F/G) or
 * "XWUTRQPNJLK" (M).
 *
 * The NRIC body is a serial. For citizens born in Singapore from 1968 it
 * starts with the birth year, but permanent residents and older citizens
 * don't follow that, so no birth year is extracted. Per Singapore's OECD TIN
 * sheet, numbers of people born in 1967 or earlier often start with 0 or 1;
 * people born before 1967 who later became permanent residents or citizens
 * got leading digits 2 or 3, and those becoming permanent residents or
 * citizens after 2008 get 4 or 5.
 *
 * UEN (Unique Entity Number, ACRA): three shapes.
 * - Business (ROB): 8 digits + check letter; weights 10,4,9,3,8,2,7,1,
 *   mod 11 into "XMKECAWLJDB".
 * - Local company (ROC): YYYY + 5-digit serial + check letter; weights
 *   10,8,6,4,9,7,5,3,1, mod 11 into "ZKCMDNERGWH".
 * - Other entities: R/S/T (18xx/19xx/20xx) + YY + 2-letter entity type +
 *   4-digit serial + check character over the 32-character alphabet
 *   "ABCDEFGHJKLMNPQRSTUVWX0123456789" with weights 4,3,5,3,10,2,2,5,7,
 *   (Σ − 5) mod 11.
 * ACRA doesn't publish the UEN check algorithms; they were reverse-engineered
 * and are cross-checked against published UENs of listed companies.
 *
 * IRAS identifiers (Singapore's OECD TIN sheet), for taxpayers without an
 * NRIC/FIN or UEN. The sheet gives shapes only, so both are format-only:
 * - SG_ASGD, IRAS tax reference number: `A` + 7 digits + check letter.
 * - SG_FOREIGN_COMPANY, foreign companies' tax reference: `F000NNNNNC` or
 *   `FDDDNNNNNC`, where D is a space. We read the spaces as standing in for
 *   the zeros and normalise both to `F000NNNNNC`.
 * Not modelled: the ITR (Income Tax Reference), `NNNNNNNNNC` or 10 digits,
 * which is too generic to tell from other numbers without its check rule.
 * Confidence `moderate`: the shapes come from the issuer, but we found no
 * published numbers to check them against.
 *
 * Improves on upstream:
 * - idnumbers checks M-series FINs without the +3 offset, so it rejects valid
 *   ones (M5012345J) and accepts wrong ones.
 * - idnumbers reads M-prefix numbers as citizens; they are foreigners' FINs.
 * - nationid's UEN compares the incorporation year against the system clock;
 *   we use `referenceDate`, and also reject "other entity" UENs whose
 *   registration year is in the future.
 */
import { weightedSum } from "../core/algorithms.js";
import { compact } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

const NRIC_WEIGHTS = [2, 7, 6, 5, 4, 3, 2];
const OFFSET: Record<string, number> = { S: 0, T: 4, F: 0, G: 4, M: 3 };
const TABLE: Record<string, string> = {
  S: "JZIHGFEDCBA",
  T: "JZIHGFEDCBA",
  F: "XWUTRQPNMLK",
  G: "XWUTRQPNMLK",
  M: "XWUTRQPNJLK",
};

/** Expected check letter for an NRIC/FIN. */
export function sgCheckLetter(id: string): string {
  const prefix = id[0]!;
  const r = (weightedSum(id.slice(1, 8), NRIC_WEIGHTS) + OFFSET[prefix]!) % 11;
  return TABLE[prefix]![r]!;
}

function parseNricFin(id: string, citizenship?: string): ParseOutcome {
  if (sgCheckLetter(id) !== id[8]) return { ok: false, reason: "invalid_checksum" };
  return {
    ok: true,
    data: {
      ...(citizenship ? { citizenship } : {}),
      serial: id.slice(1, 8),
      extra: { series: id[0]! },
    },
  };
}

const NRIC_SOURCES = [
  "https://sso.agc.gov.sg/Act/NRA1965",
  "https://www.ica.gov.sg/reside",
  "https://userapps.support.sap.com/sap/support/knowledge/en/2572734",
  "https://en.wikipedia.org/wiki/National_Registration_Identity_Card",
];

// --- UEN ---------------------------------------------------------------------

const ROB_WEIGHTS = [10, 4, 9, 3, 8, 2, 7, 1];
const ROB_TABLE = "XMKECAWLJDB";
const ROC_WEIGHTS = [10, 8, 6, 4, 9, 7, 5, 3, 1];
const ROC_TABLE = "ZKCMDNERGWH";
const OTHER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWX0123456789";
const OTHER_WEIGHTS = [4, 3, 5, 3, 10, 2, 2, 5, 7];
const ERA: Record<string, number> = { R: 1800, S: 1900, T: 2000 };

/** Entity-type codes used in "other entity" UENs (ACRA UEN issuance agencies). */
export const SG_UEN_ENTITY_TYPES: ReadonlySet<string> = new Set(
  "CC CD CH CL CM CP CS CX DP FB FC FM FN GA GB GS HS LL LP MB MC MD MH MM MQ NB NR PA PB PF RF RP SM SS TC TU VH XL".split(" "),
);

function parseUen(id: string, referenceDate: Date): ParseOutcome {
  const thisYear = referenceDate.getFullYear();
  if (/^\d{8}[A-Z]$/.test(id)) {
    if (ROB_TABLE[weightedSum(id, ROB_WEIGHTS) % 11] !== id[8]) return { ok: false, reason: "invalid_checksum" };
    return { ok: true, data: { serial: id.slice(0, 8), extra: { category: "business" } } };
  }
  if (/^\d{9}[A-Z]$/.test(id)) {
    const year = Number(id.slice(0, 4));
    if (year > thisYear) return { ok: false, reason: "invalid_range" };
    if (ROC_TABLE[weightedSum(id, ROC_WEIGHTS) % 11] !== id[9]) return { ok: false, reason: "invalid_checksum" };
    return { ok: true, data: { serial: id.slice(4, 9), extra: { category: "local_company", registrationYear: year } } };
  }
  const entityType = id.slice(3, 5);
  if (!SG_UEN_ENTITY_TYPES.has(entityType)) return { ok: false, reason: "invalid_range" };
  const year = ERA[id[0]!]! + Number(id.slice(1, 3));
  if (year > thisYear) return { ok: false, reason: "invalid_range" };
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += OTHER_ALPHABET.indexOf(id[i]!) * OTHER_WEIGHTS[i]!;
  if (OTHER_ALPHABET[(((sum - 5) % 11) + 11) % 11] !== id[9]) return { ok: false, reason: "invalid_checksum" };
  return {
    ok: true,
    data: { serial: id.slice(5, 9), extra: { category: "other", entityType, registrationYear: year } },
  };
}

const OECD_SHEET = "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf";

/** `compact()`, then the spaced foreign-company form `F   NNNNNC` written with its zeros. */
export function normalizeForeignCompany(input: string): string {
  const c = compact(input);
  return /^F\d{5}[A-Z]$/.test(c) ? `F000${c.slice(1)}` : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "SG_NRIC",
    country: "SG",
    name: "Singapore National Registration Identity Card Number",
    aliases: ["NRIC", "IC number", "pink IC", "blue IC"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^[ST]\d{7}[A-Z]$/,
    example: "S1234567D",
    sources: NRIC_SOURCES,
    upstream: ["idnumbers", "nationid"],
    parse: (id) => parseNricFin(id),
  },
  {
    code: "SG_FIN",
    country: "SG",
    name: "Singapore Foreign Identification Number",
    aliases: ["FIN", "work pass number", "employment pass", "S pass"],
    purpose: "migratory",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^[FGM]\d{7}[A-Z]$/,
    example: "M5012345J",
    sources: [...NRIC_SOURCES, "https://www.mom.gov.sg/passes-and-permits"],
    upstream: ["idnumbers", "nationid"],
    parse: (id) => parseNricFin(id, "foreigner"),
  },
  {
    code: "SG_UEN",
    country: "SG",
    name: "Singapore Unique Entity Number",
    aliases: ["UEN", "ROC number", "ROB number", "company registration number", "GST number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [9, 10],
    pattern: /^(\d{8}[A-Z]|(18|19|20)\d{7}[A-Z]|[RST]\d{2}[A-Z]{2}\d{4}[A-HJ-NP-X0-9])$/,
    example: "197401143C",
    sources: [
      "https://sso.agc.gov.sg/Act/UENA2008",
      "https://www.uen.gov.sg/ueninternet/faces/pages/admin/aboutUEN.jspx",
      OECD_SHEET,
    ],
    upstream: ["nationid"],
    parse: (id, { referenceDate }) => parseUen(id, referenceDate),
  },
  {
    code: "SG_ASGD",
    country: "SG",
    name: "Singapore IRAS Tax Reference Number (ASGD)",
    aliases: ["ASGD", "IRAS tax reference number", "tax reference number"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^A\d{7}[A-Z]$/,
    example: "A1234567B",
    sources: [OECD_SHEET],
    parse: (id) => ({ ok: true, data: { serial: id.slice(1, 8), extra: { checkLetter: id[8]! } } }),
  },
  {
    code: "SG_FOREIGN_COMPANY",
    country: "SG",
    name: "Singapore Foreign Company Tax Reference Number",
    aliases: ["foreign company TIN", "IRAS tax reference number"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^F000\d{5}[A-Z]$/,
    example: "F00012345C",
    sources: [OECD_SHEET],
    normalize: normalizeForeignCompany,
    parse: (id) => ({ ok: true, data: { serial: id.slice(4, 9), extra: { checkLetter: id[9]! } } }),
  },
];
