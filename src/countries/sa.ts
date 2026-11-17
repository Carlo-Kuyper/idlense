/**
 * Saudi Arabia — 10-digit identity numbers issued by the Ministry of Interior
 * (National Information Center): T NNNNNNNN C.
 *
 * - T  holder type: 1 = Saudi citizen (National ID, الهوية الوطنية),
 *      2 = resident foreigner (Iqama, هوية مقيم).
 * - NNNNNNNN serial, 00000000-99999999.
 * - C  Luhn check digit over the first nine digits.
 * The number encodes no date of birth or gender. The SAMA rulebook (Saudi
 * Central Bank, "computer number" structure) confirms T (1 citizen,
 * 2 resident; 3/5 visitors, 6 pilgrims, 7 entities are not modelled) and the
 * digits 2-9 serial, but says the check-digit formula isn't published:
 * entities must request it from the National Information Center. The Luhn
 * rule comes from community validators and has not been confirmed by the
 * issuer, hence confidence `moderate`.
 *
 * Split into two documents so callers can ask for citizens or residents
 * (purpose `identity` vs `migratory`); both extract `citizenship`.
 *
 * Ported from idnumbers.
 *
 * Improves on upstream:
 * - idnumbers hard-codes 2000000007 as valid (a fixture carried over from the
 *   Python port) although it fails the Luhn check. We don't.
 */
import { luhnValid } from "../core/algorithms.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const common = {
  country: "SA",
  holder: "person",
  checksum: true,
  confidence: "moderate",
  lengths: [10],
  normalize: digitsOnly,
  upstream: ["idnumbers"],
  sources: [
    "https://rulebook.sama.gov.sa/en/entiresection/2324",
    "https://www.absher.sa/",
    "https://www.my.gov.sa/en/content/national-id",
    "https://en.wikipedia.org/wiki/Saudi_national_identity_card",
  ],
} as const;

function parse(id: string, citizenship: string) {
  if (!luhnValid(id)) return { ok: false as const, reason: "invalid_checksum" as const };
  return { ok: true as const, data: { citizenship, serial: id.slice(1, 9), extra: {} } };
}

export const documents: DocumentSpec[] = [
  {
    ...common,
    code: "SA_NIN",
    name: "Saudi National ID Number",
    localName: "رقم الهوية الوطنية",
    aliases: ["Saudi ID", "National ID", "NIN", "huwiyya"],
    purpose: "identity",
    pattern: /^1\d{9}$/,
    example: "1000000008",
    parse: (id) => parse(id, "citizen"),
  },
  {
    ...common,
    code: "SA_IQAMA",
    name: "Saudi Resident Identity Number",
    localName: "رقم الإقامة",
    aliases: ["Iqama", "resident ID", "muqeem"],
    purpose: "migratory",
    pattern: /^2\d{9}$/,
    example: "2123456788",
    parse: (id) => parse(id, "resident"),
  },
];
