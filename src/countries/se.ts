/**
 * Sweden — personnummer, samordningsnummer, organisationsnummer and VAT number.
 *
 * Personnummer (Folkbokföringslag 1991:481 §18): YYMMDD-NNNC, 10 digits.
 * - The separator carries the century: `-` (or none) while the holder is
 *   under 100, `+` from the year they turn 100. The 12-digit machine form
 *   YYYYMMDDNNNC states the century outright.
 * - NNN birth number; its last digit is odd for men, even for women.
 * - C Luhn check digit over the 10-digit form (the century is never included).
 * - Samordningsnummer (Lag 2022:1697): same layout, day of birth + 60.
 *
 * Organisationsnummer (Lag 1974:174): 10 digits, Luhn. The third digit is
 * always ≥ 2, which keeps it apart from a personnummer (whose third digit is
 * the first digit of a month). The first digit is the legal-form group.
 *
 * VAT (momsregistreringsnummer): `SE` + 10 digits + `01`. The 10 digits are
 * the organisationsnummer, or the owner's personnummer for a sole trader
 * (enskild näringsidkare).
 *
 * Improves on upstream:
 * - idnumbers reads a 10-digit number written without a separator as a
 *   100+-year-old (e.g. 8112289874 → 1881) and rejects the 12-digit form;
 *   we read no separator as `-` and accept YYYYMMDDNNNC.
 * - idnumbers uses the wall clock instead of `referenceDate` for the century,
 *   and nationid ignores `+` entirely and never resolves a century.
 * - nationid accepts impossible dates (Feb 30) and future birth dates; both
 *   are rejected (`invalid_date`).
 * - nationid accepts a 12-digit number from any century (e.g. 2399...); we
 *   require 18xx-20xx and a past date.
 * - Samordningsnummer gets its own code (idnumbers rejects them; nationid
 *   folds them into SE_PERSONNUMMER without saying which one it is).
 * - nationid's SE_VAT rejects sole traders' VAT numbers (personnummer + 01).
 */
import { luhnValid } from "../core/algorithms.js";
import { birthFields, isPastDate, isoDate, latestPastYear, todayIso } from "../core/dates.js";
import type { DocumentSpec, ParseContext, ParseOutcome } from "../core/types.js";

const MM = "(0[1-9]|1[0-2])";

/** Full year for a 10-digit personnummer; `plus` = holder is 100 or older. */
export function swedishYear(yy: number, month: number, day: number, plus: boolean, ref: Date): number | undefined {
  if (!plus) return latestPastYear(yy, month, day, ref);
  const today = todayIso(ref);
  for (let c = Math.floor(ref.getFullYear() / 100) * 100; c >= 1800; c -= 100) {
    const year = c + yy;
    // Turned 100 on or before the reference date.
    if (isPastDate(year, month, day, ref) && isoDate(year + 100, month, day) <= today) return year;
  }
  return undefined;
}

function parsePerson(id: string, coordination: boolean, ctx: ParseContext): ParseOutcome {
  const plus = id.includes("+");
  const digits = id.replace("+", "");
  const ten = digits.length === 12 ? digits.slice(2) : digits;
  const month = Number(ten.slice(2, 4));
  let day = Number(ten.slice(4, 6));
  if (coordination) day -= 60;
  const year =
    digits.length === 12
      ? Number(digits.slice(0, 4))
      : swedishYear(Number(ten.slice(0, 2)), month, day, plus, ctx.referenceDate);
  const birth = year === undefined ? undefined : birthFields(year, month, day, ctx.referenceDate);
  if (!birth) return { ok: false, reason: "invalid_date" };
  if (!luhnValid(ten)) return { ok: false, reason: "invalid_checksum" };
  return {
    ok: true,
    data: {
      ...birth,
      gender: Number(ten[8]) % 2 === 1 ? "male" : "female",
      serial: ten.slice(6, 9),
      extra: coordination ? { kind: "samordningsnummer" } : {},
    },
  };
}

function formatPerson(c: string): string {
  if (c.length === 12) return `${c.slice(0, 8)}-${c.slice(8)}`;
  if (c.includes("+")) return c;
  return `${c.slice(0, 6)}-${c.slice(6)}`;
}

const personPattern = (dd: string) =>
  new RegExp(`^(\\d{2}${MM}${dd}\\+?\\d{4}|(18|19|20)\\d{2}${MM}${dd}\\d{4})$`);

const PERSON_SOURCES = [
  "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/folkbokforingslag-1991481_sfs-1991-481/",
  "https://www.skatteverket.se/privat/folkbokforing/personnummerochsamordningsnummer.4.3810a01c150939e893f18c29.html",
  "https://en.wikipedia.org/wiki/Personal_identity_number_(Sweden)",
];

/** Bolagsverket's first-digit groups. */
const ORG_GROUPS: Record<string, string> = {
  "1": "estate",
  "2": "public_body",
  "3": "foreign_company",
  "5": "limited_company",
  "6": "simple_partnership",
  "7": "economic_association",
  "8": "non_profit_or_foundation",
  "9": "trading_partnership",
};

export const documents: DocumentSpec[] = [
  {
    code: "SE_PERSONNUMMER",
    country: "SE",
    name: "Swedish Personal Identity Number",
    localName: "Personnummer",
    aliases: ["PNR", "personal number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [10, 11, 12],
    pattern: personPattern("(0[1-9]|[12]\\d|3[01])"),
    example: "8112289874",
    sources: PERSON_SOURCES,
    upstream: ["idnumbers", "nationid"],
    format: formatPerson,
    parse: (id, ctx) => parsePerson(id, false, ctx),
  },
  {
    code: "SE_SAMORDNINGSNUMMER",
    country: "SE",
    name: "Swedish Coordination Number",
    localName: "Samordningsnummer",
    aliases: ["coordination number"],
    purpose: "migratory",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [10, 11, 12],
    // day + 60: 61-91
    pattern: personPattern("(6[1-9]|[78]\\d|9[01])"),
    example: "7010632391",
    sources: [
      "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20221697-om-samordningsnummer_sfs-2022-1697/",
      "https://www.skatteverket.se/privat/folkbokforing/samordningsnummer.4.5c281c7015abecc2e201130b.html",
    ],
    upstream: ["nationid"],
    format: formatPerson,
    parse: (id, ctx) => parsePerson(id, true, ctx),
  },
  {
    code: "SE_ORGNR",
    country: "SE",
    name: "Swedish Organisation Number",
    localName: "Organisationsnummer",
    aliases: ["orgnr", "company number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^\d{2}[2-9]\d{7}$/,
    example: "2021005489",
    sources: [
      "https://bolagsverket.se/foretag/organisationsnummer.1207.html",
      "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1974174-om-identitetsbeteckning-for_sfs-1974-174/",
    ],
    upstream: ["nationid"],
    format: (c) => `${c.slice(0, 6)}-${c.slice(6)}`,
    parse(id) {
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      const group = ORG_GROUPS[id[0]!];
      const extra: Record<string, string> = {};
      if (group) extra.legalFormGroup = group;
      return { ok: true, data: { extra } };
    },
  },
  {
    code: "SE_VAT",
    country: "SE",
    name: "Swedish VAT Number",
    localName: "Momsregistreringsnummer",
    aliases: ["momsnummer", "VAT ID"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [14],
    pattern: /^SE\d{10}01$/,
    example: "SE202100548901",
    sources: [
      "https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/forsaljningtillandraeulander/kontrolleramomsregistreringsnummervatnummer/momsregistreringsnummer.4.18e1b10334ebe8bc80002649.html",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    parse(id) {
      const ten = id.slice(2, 12);
      const soleTrader = Number(ten[2]) < 2;
      // A sole trader's number is their personnummer (or samordningsnummer).
      if (soleTrader && !/^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]|6[1-9]|[78]\d|9[01])\d{4}$/.test(ten)) {
        return { ok: false, reason: "invalid_format" };
      }
      if (!luhnValid(ten)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: { holderType: soleTrader ? "sole_trader" : "organisation" } } };
    },
  },
];
