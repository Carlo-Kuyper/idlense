/**
 * Morocco — CNIE number and the ICE (company identifier).
 *
 * MA_CIN, the number on the Carte Nationale d'Identité Électronique (CNIE).
 * Law 04-20 (Dahir 1-20-80, BO 7080 of 2022) gives every person one unique
 * national identity number, printed on both faces and in the MRZ, but doesn't
 * define its structure. As printed it is 1 or 2 letters for the issuing office
 * (region) followed by a serial of up to 6 digits. The World Bank ID4D
 * diagnostic (2014, Table 5 and annex) describes "two alpha for issuing office,
 * 6 digits serial number, 2 digit check sum". Those two check digits are not
 * part of the number people write down, and no algorithm is published (the
 * "Luhn, 12 characters" claim on English Wikipedia cites that report, which
 * says neither), so we validate only the shape. No DGSN table of the letter
 * prefixes exists, so `region` is the raw prefix. Confidence `low`.
 *
 * MA_ICE, the Identifiant Commun de l'Entreprise: 15 digits, 9 for the
 * enterprise, 4 for the establishment and 2 control digits. The whole number
 * read as an integer is ≡ 0 (mod 97). The ICE portal doesn't publish the rule;
 * python-stdnum documents it, and it holds on stdnum's examples and on Ciments
 * du Maroc's ICE in its published statutes. Confidence `moderate`.
 *
 * Not covered: the Identifiant Fiscal (IF). We found only a few 7- and 8-digit
 * company examples and no rule.
 */
import { mod97 } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "MA_CIN",
    country: "MA",
    name: "Moroccan National Identity Card Number",
    localName: "البطاقة الوطنية للتعريف الإلكترونية / Carte Nationale d'Identité Électronique",
    aliases: ["CIN", "CNIE", "CNI", "numéro national d'identité"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [2, 3, 4, 5, 6, 7, 8],
    pattern: /^[A-Z]{1,2}\d{1,6}$/,
    example: "AB123456",
    sources: [
      "https://adala.justice.gov.ma/api/uploads/2025/10/13/Dahir n° 1-20-80 portant promulgation de la loi n° 04-20 relative à la Carte Nationale d'Identité Electronique-1760343912466.pdf",
      "https://documents1.worldbank.org/curated/en/363901472492458796/pdf/107931-WP-P156810-OUO-9.pdf",
    ],
    parse(id) {
      const m = /^([A-Z]{1,2})(\d+)$/.exec(id)!;
      return { ok: true, data: { region: m[1]!, serial: m[2]!, extra: {} } };
    },
  },
  {
    code: "MA_ICE",
    country: "MA",
    name: "Moroccan Common Company Identifier",
    localName: "Identifiant Commun de l'Entreprise",
    aliases: ["ICE"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [15],
    pattern: /^\d{15}$/,
    example: "001561191000066",
    sources: ["https://www.ice.gov.ma/", "https://arthurdejong.org/python-stdnum/doc/2.1/stdnum.ma.ice"],
    normalize: digitsOnly,
    format: (c) => group(c, [9, 4, 2], " "),
    parse(id) {
      if (mod97(id) !== 0) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(0, 9), extra: { establishment: id.slice(9, 13) } } };
    },
  },
];
