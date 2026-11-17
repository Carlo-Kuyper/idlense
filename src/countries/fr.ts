/**
 * France — NIR (social security number), SIREN, SIRET and VAT number.
 *
 * NIR (INSEE, 15 characters): S YY MM DD(D) CCC(CC) OOO KK
 * - S   sex: 1 male, 2 female; 7/8 (and 3/4) provisional numbers issued by the
 *       CPAM before the civil status is certified (odd male, even female).
 * - YY  last two digits of the birth year. The century isn't encoded.
 * - MM  01-12, or a fictitious month 20-42 / 50-99 when the month is unknown.
 * - Birthplace (5 characters):
 *   - 01-95 département + 3-digit commune (91-94 also Algeria before 1962, 95 Morocco),
 *     96 Tunisia (births before independence in 1956),
 *     2A / 2B for Corsica (births from 1976 on; 20 before),
 *   - 97x / 98x overseas département + 2-digit commune,
 *   - 99 + 3-digit INSEE country code for people born abroad.
 * - OOO order number 001-999.
 * - KK  97 − (first 13 digits mod 97), with 2A → 19 and 2B → 18; so 01-97.
 *
 * SIREN: 9 digits, Luhn. SIRET: SIREN + 5-digit establishment number, Luhn over
 * all 14 digits; La Poste's establishments (SIREN 356000000) use digit sum ≡ 0 mod 5.
 * VAT: FR + 2-character key + SIREN. Numeric key = (12 + 3·(SIREN mod 97)) mod 97.
 * The alphanumeric keys of newer numbers aren't publicly specified, so only the
 * SIREN is checked for those.
 *
 * Improves on upstream:
 * - idnumbers picks the century with a fixed cut-off (YY ≤ 25 → 20YY) and builds a
 *   `Date` (timezone-shifted); we take the latest past year and don't invent a day.
 * - Both upstreams accept 2A/2B with birth years 1927-1975 (Corsica used 20 then)
 *   and 20 with years 1976-1999: `invalid_range`.
 * - nationid rejects most fictitious months (only 20/30/40/50/99) and sex digit 4,
 *   but accepts département 00 and order number 000.
 * - Both reject département 96 (Tunisia before 1956, per service-public.fr).
 * - Birthplace, provisional status and birth country code are extracted.
 */
import { luhnValid } from "../core/algorithms.js";
import { latestPastYear } from "../core/dates.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export function nirKey(first13: string): number {
  const n = first13.replace(/^(.{5})2A/, "$119").replace(/^(.{5})2B/, "$118");
  return 97 - (Number(n) % 97);
}

export function tvaKey(siren: string): number {
  return (12 + 3 * (Number(siren) % 97)) % 97;
}

const LA_POSTE = "356000000";

export const documents: DocumentSpec[] = [
  {
    code: "FR_NIR",
    country: "FR",
    name: "French Social Security Number",
    localName: "Numéro d'inscription au répertoire (NIR)",
    aliases: ["numéro de sécurité sociale", "INSEE number", "carte Vitale number", "NSS"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [15],
    pattern: /^[123478]\d{2}(0[1-9]|1[0-2]|[23]\d|4[0-2]|[5-9]\d)(?!00)(\d{2}|2[AB])\d{3}(?!000)\d{3}(0[1-9]|[1-8]\d|9[0-7])$/,
    example: "185057800608491",
    sources: [
      "https://www.insee.fr/fr/metadonnees/definition/c1409",
      "https://www.service-public.gouv.fr/particuliers/vosdroits/F33078",
      "https://www.net-entreprises.fr/media/documentation/dsn-identification-des-salaries.pdf",
      "https://fr.wikipedia.org/wiki/Num%C3%A9ro_de_s%C3%A9curit%C3%A9_sociale_en_France",
    ],
    upstream: ["idnumbers", "nationid"],
    format: (c) => group(c, [1, 2, 2, 2, 3, 3, 2], " "),
    parse(id, { referenceDate }) {
      if (nirKey(id.slice(0, 13)) !== Number(id.slice(13))) return { ok: false, reason: "invalid_checksum" };
      const yy = Number(id.slice(1, 3));
      const mm = Number(id.slice(3, 5));
      const knownMonth = mm >= 1 && mm <= 12;
      const year = latestPastYear(yy, knownMonth ? mm : 1, 1, referenceDate);
      if (year === undefined) return { ok: false, reason: "invalid_date" };
      const dept = id.slice(5, 7);
      if ((dept === "2A" || dept === "2B") && year < 1976) return { ok: false, reason: "invalid_range" };
      if (dept === "20" && year >= 1976 && year <= 1999) return { ok: false, reason: "invalid_range" };
      if (dept === "96" && year > 1956) return { ok: false, reason: "invalid_range" };
      const sex = Number(id[0]);
      const extra: Record<string, string | number | boolean> = { provisional: sex > 2 };
      if (knownMonth) extra.birthMonth = mm;
      let region = dept;
      if (dept === "97" || dept === "98") {
        region = id.slice(5, 8);
        extra.commune = id.slice(8, 10);
      } else if (dept === "99") {
        extra.birthCountryCode = id.slice(7, 10);
      } else {
        extra.commune = id.slice(7, 10);
      }
      return {
        ok: true,
        data: {
          birthYear: year,
          gender: sex % 2 === 1 ? "male" : "female",
          region,
          ...(dept === "99" ? { regionName: "born abroad" } : {}),
          serial: id.slice(10, 13),
          extra,
        },
      };
    },
  },
  {
    code: "FR_SIREN",
    country: "FR",
    name: "French Company Identification Number",
    localName: "SIREN",
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "732829320",
    sources: ["https://www.insee.fr/fr/metadonnees/definition/c2047", "https://en.wikipedia.org/wiki/SIREN_code"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], " "),
    parse: (id) => (luhnValid(id) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
  {
    code: "FR_SIRET",
    country: "FR",
    name: "French Establishment Identification Number",
    localName: "SIRET",
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [14],
    pattern: /^\d{14}$/,
    example: "73282932000009",
    sources: ["https://www.insee.fr/fr/metadonnees/definition/c1841", "https://fr.wikipedia.org/wiki/Syst%C3%A8me_d%27identification_du_r%C3%A9pertoire_des_%C3%A9tablissements"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3, 5], " "),
    parse(id) {
      const ok = id.startsWith(LA_POSTE)
        ? [...id].reduce((s, c) => s + Number(c), 0) % 5 === 0
        : luhnValid(id) && luhnValid(id.slice(0, 9));
      if (!ok) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(9), extra: { siren: id.slice(0, 9) } } };
    },
  },
  {
    code: "FR_TVA",
    country: "FR",
    name: "French VAT Number",
    localName: "Numéro de TVA intracommunautaire",
    aliases: ["VAT number", "TVA"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: /^FR[0-9A-HJ-NP-Z]{2}\d{9}$/,
    example: "FR40303265045",
    sources: [
      "https://www.impots.gouv.fr/professionnel/questions/comment-obtenir-un-numero-de-tva-intracommunautaire",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize(input) {
      const c = compact(input);
      return /^[0-9A-HJ-NP-Z]{2}\d{9}$/.test(c) ? "FR" + c : c;
    },
    format: (c) => `${c.slice(0, 2)} ${c.slice(2, 4)} ${group(c.slice(4), [3, 3, 3], " ")}`,
    parse(id) {
      const key = id.slice(2, 4);
      const siren = id.slice(4);
      if (!luhnValid(siren) && siren !== LA_POSTE) return { ok: false, reason: "invalid_checksum" };
      if (/^\d\d$/.test(key) && tvaKey(siren) !== Number(key)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: { siren, keyVerified: /^\d\d$/.test(key) } } };
    },
  },
];
