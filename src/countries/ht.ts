/**
 * Haiti — NIF (tax), NINU (unique national ID number) and the older CIN
 * national identity card numbers.
 *
 * HT_NIF: Numéro d'Immatriculation (Identification) Fiscale, issued by the
 * Direction Générale des Impôts since 1987 to individuals and legal persons.
 * 10 digits; the last one is a check digit ("dont le dernier sert à vérifier
 * l'intégrité de la carte", IRB response doc 451717). The algorithm isn't published,
 * so this is a shape check.
 *
 * HT_NINU: Numéro d'Identification Nationale Unique, issued by the Office
 * National d'Identification (ONI) from birth (decree of 11 March 2020;
 * implementing order of 19 December 2025). The 2017 bill says it "comporte la
 * même structure de codage que le NIF" and that existing NIF holders get a
 * NINU identical to their NIF; the ONI's description of the new card says
 * 10 digits. Same shape check as the NIF.
 *
 * HT_CIN: the number on the earlier Carte d'Identification Nationale.
 * - First generation, 17 digits `DD-CC-PP-YYYY-MM-NNNNN` (2005 decree; ONI
 *   statements quoted by the IRB in 2010 and 2015; Keesing DocumentChecker
 *   for the hyphenation): department, commune, country code (99 = Haiti,
 *   00 = Dominican Republic), year and month of birth, registration serial.
 *   We extract those and reject a month 13+ or a future birth month. Only
 *   two department codes are confirmed (01 Ouest, 07 Sud), so only those get
 *   a `regionName`.
 * - Second generation, 14 digits, issued from December 2014. Its layout is in
 *   an ONI annex we couldn't read, so it's accepted on length only.
 * Both are superseded by the NINU (deprecated).
 *
 * Confidence is low for the NINU and CIN (IRB reports of ONI statements,
 * not an ONI spec), moderate for the NIF's length.
 *
 * No upstream library has any of them.
 */
import { isPastDate } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Department codes the ONI confirmed to the IRB (HTI202498). */
export const HT_DEPARTMENTS: Record<string, string> = { "01": "Ouest", "07": "Sud" };

const CIN_COUNTRIES: Record<string, string> = { "99": "Haiti", "00": "Dominican Republic" };

const IRB_2026 = "https://www.ecoi.net/en/document/2137260.html";
const IRB_2015 = "https://www.irb-cisr.gc.ca/fr/renseignements-pays/rdi/Pages/index.aspx?doc=455932&pls=1";

export const documents: DocumentSpec[] = [
  {
    code: "HT_NIF",
    country: "HT",
    name: "Haitian Tax Identification Number",
    localName: "Numéro d'Identification Fiscale",
    aliases: ["NIF", "Numéro d'Immatriculation Fiscale", "carte d'identité fiscale"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234567890",
    sources: [
      "https://www.irb-cisr.gc.ca/fr/renseignements-pays/rdi/Pages/index.aspx?doc=451717",
      "https://fr.wikipedia.org/wiki/Num%C3%A9ro_d'immatriculation_fiscale",
      "https://www.haitidocs.org/doc/mef-decret-numero-immatriculation-fiscale",
    ],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "HT_NINU",
    country: "HT",
    name: "Haitian Unique National Identification Number",
    localName: "Numéro d'Identification Nationale Unique",
    aliases: ["NINU", "NIU", "CINU"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234567890",
    sources: [
      IRB_2026,
      "https://www.ecoi.net/en/document/2137253.html",
      "https://www.lenational.org/article/politique/7452/les-modalites-dapplication-du-numero-didentification-nationale-unique-et-de-la-carte-didentification-nationale-fixees",
    ],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "HT_CIN",
    country: "HT",
    name: "Haitian National Identity Card Number",
    localName: "Numéro de la Carte d'Identification Nationale",
    aliases: ["CIN", "NIN"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    deprecated: true,
    lengths: [14, 17],
    pattern: /^(?:\d{14}|\d{10}(?:0[1-9]|1[0-2])\d{5})$/,
    example: "01059919850300123",
    sources: [IRB_2026, IRB_2015, "https://www.ecoi.net/en/document/2137253.html"],
    normalize: digitsOnly,
    format: (c) => (c.length === 17 ? group(c, [2, 2, 2, 4, 2, 5], "-") : c),
    parse(id, { referenceDate }) {
      if (id.length === 14) return { ok: true, data: { extra: { generation: 2 } } };
      const year = Number(id.slice(6, 10));
      const month = Number(id.slice(10, 12));
      if (!isPastDate(year, month, 1, referenceDate)) return { ok: false, reason: "invalid_date" };
      const region = id.slice(0, 2);
      const regionName = HT_DEPARTMENTS[region];
      const countryCode = id.slice(4, 6);
      const countryName = CIN_COUNTRIES[countryCode];
      return {
        ok: true,
        data: {
          birthYear: year,
          region,
          ...(regionName ? { regionName } : {}),
          serial: id.slice(12),
          extra: {
            generation: 1,
            birthMonth: month,
            commune: id.slice(2, 4),
            countryCode,
            ...(countryName ? { countryName } : {}),
          },
        },
      };
    },
  },
];
