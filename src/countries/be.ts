/**
 * Belgium — national register number, BIS number and enterprise/VAT number.
 *
 * National register number (Rijksregisternummer / numéro de registre national),
 * 11 digits YY MM DD SSS CC:
 * - YYMMDD date of birth. Month and/or day 00 when the registry doesn't know them.
 * - SSS    counter 001-997: odd for men, even for women.
 * - CC     97 − (first 9 digits mod 97). For people born from 2000 on, a `2` is
 *          put in front of the 9 digits first; so the check digits tell the century.
 *
 * BIS number (Kruispuntbank / Banque Carrefour, for people not in the national
 * register, e.g. non-resident foreigners): same layout and check, month + 20 when
 * the sex was unknown at registration, month + 40 when it was known.
 *
 * Enterprise number (KBO/BCE), also the VAT number: 10 digits starting 0 or 1,
 * last two = 97 − (first 8 mod 97).
 *
 * Improves on upstream:
 * - idnumbers picks the century from YY < 50 instead of from the check digits, so
 *   everyone born 1900-1949 is rejected (and 2050+ can't exist yet); it also
 *   rejects BIS numbers and unknown-date (00) numbers.
 * - nationid only checks day ≤ 31 and month ≤ 12 (accepts 30 February), accepts
 *   future birth dates and counters 000/998/999, and rejects BIS numbers whose
 *   month is unknown (month 20 or 40).
 * - BIS numbers are split into `BE_BIS` (foreigners) and don't report a gender
 *   when the sex was unknown (month + 20).
 */
import { birthFields, isPastDate } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

const mod97 = (s: string): number => {
  let r = 0;
  for (const c of s) r = (r * 10 + (c.charCodeAt(0) - 48)) % 97;
  return r;
};

/** 1900 or 2000 by which check matches, or undefined. */
export function beCentury(id: string): 1900 | 2000 | undefined {
  const cc = Number(id.slice(9, 11));
  if (97 - mod97(id.slice(0, 9)) === cc) return 1900;
  if (97 - mod97("2" + id.slice(0, 9)) === cc) return 2000;
  return undefined;
}

export function beCheck(first9: string, century: 1900 | 2000): string {
  return String(97 - mod97((century === 2000 ? "2" : "") + first9)).padStart(2, "0");
}

function parseRegister(id: string, monthOffset: number, referenceDate: Date): ParseOutcome {
  const century = beCentury(id);
  if (century === undefined) return { ok: false, reason: "invalid_checksum" };
  const counter = Number(id.slice(6, 9));
  if (counter === 0 || counter > 997) return { ok: false, reason: "invalid_range" };
  const year = century + Number(id.slice(0, 2));
  const month = Number(id.slice(2, 4)) - monthOffset;
  const day = Number(id.slice(4, 6));
  let birth: { dateOfBirth?: string; birthYear: number } | undefined;
  if (month === 0 || day === 0) {
    // Partly unknown date: check what is known.
    if (day > 31 || !isPastDate(year, month || 1, day || 1, referenceDate)) return { ok: false, reason: "invalid_date" };
    birth = { birthYear: year };
  } else {
    birth = birthFields(year, month, day, referenceDate);
    if (!birth) return { ok: false, reason: "invalid_date" };
  }
  const sexKnown = monthOffset !== 20;
  return {
    ok: true,
    data: {
      ...birth,
      ...(sexKnown ? { gender: counter % 2 === 1 ? ("male" as const) : ("female" as const) } : {}),
      serial: id.slice(6, 9),
      extra: {},
    },
  };
}

const format = (c: string) => `${c.slice(0, 2)}.${c.slice(2, 4)}.${c.slice(4, 6)}-${c.slice(6, 9)}.${c.slice(9)}`;
const SOURCES = [
  "https://www.ibz.rrn.fgov.be/fileadmin/user_upload/fr/rn/instructions/liste-TI/TI000_Numerodidentification.pdf",
  "https://www.ksz-bcss.fgov.be/fr/services-et-support/services/registres-bcss",
  "https://en.wikipedia.org/wiki/National_identification_number#Belgium",
];

export const documents: DocumentSpec[] = [
  {
    code: "BE_NRN",
    country: "BE",
    name: "Belgian National Register Number",
    localName: "Rijksregisternummer / Numéro de registre national",
    aliases: ["NRN", "RRN", "INSZ", "NISS", "national number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^\d{2}(0\d|1[0-2])(0\d|[12]\d|3[01])\d{5}$/,
    example: "85073003328",
    sources: SOURCES,
    upstream: ["idnumbers", "nationid"],
    normalize: digitsOnly,
    format,
    parse: (id, ctx) => parseRegister(id, 0, ctx.referenceDate),
  },
  {
    code: "BE_BIS",
    country: "BE",
    name: "Belgian BIS Number",
    localName: "BIS-nummer / Numéro BIS",
    aliases: ["BIS", "INSZ", "NISS"],
    purpose: "migratory",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^\d{2}(2\d|3[0-2]|4\d|5[0-2])(0\d|[12]\d|3[01])\d{5}$/,
    example: "85473003317",
    sources: SOURCES,
    upstream: ["nationid"],
    normalize: digitsOnly,
    format,
    parse(id, ctx) {
      const m = Number(id.slice(2, 4));
      const r = parseRegister(id, m >= 40 ? 40 : 20, ctx.referenceDate);
      return r.ok ? { ok: true, data: { ...r.data, citizenship: "foreigner", extra: { sexKnown: m >= 40 } } } : r;
    },
  },
  {
    code: "BE_BTW",
    country: "BE",
    name: "Belgian Enterprise / VAT Number",
    localName: "Ondernemingsnummer / Numéro d'entreprise",
    aliases: ["KBO", "BCE", "BTW", "TVA", "VAT number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [12],
    pattern: /^BE[01]\d{9}$/,
    example: "BE0403170701",
    sources: [
      "https://economie.fgov.be/en/themes/enterprises/crossroads-bank-enterprises/registration-crossroads-bank",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize(input) {
      const c = compact(input);
      const body = c.startsWith("BE") ? c.slice(2) : c;
      if (/^\d{9}$/.test(body)) return "BE0" + body; // old 9-digit numbers
      if (/^\d{10}$/.test(body)) return "BE" + body;
      return c;
    },
    format: (c) => `BE ${c.slice(2, 6)}.${c.slice(6, 9)}.${c.slice(9)}`,
    parse(id) {
      if (97 - (Number(id.slice(2, 10)) % 97) !== Number(id.slice(10))) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
