/**
 * Armenia — public services number (PSN, social card number) and taxpayer
 * identification number (TIN / ՀՎՀՀ).
 *
 * PSN: a 10-digit identifier issued by the Migration and Citizenship Service
 * to citizens, resident foreigners, stateless persons and refugees (Law on
 * Public Service Number; Government Decision 419-N of 05.04.2012). Its
 * internal structure and any check digit aren't published, so this is
 * shape-only and extracts nothing. (Commercial sites claim it encodes sex and
 * birth date; we found no official confirmation.)
 *
 * TIN: 8 digits, a 7-digit serial and a check digit "calculated based on the
 * previous 7 digits" (State Revenue Committee). The algorithm isn't published,
 * so this is shape-only too. Issued to both individuals and entities.
 *
 * No upstream library covers Armenia.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "AM_PSN",
    country: "AM",
    name: "Armenian Public Services Number",
    localName: "Հանրային ծառայությունների համարանիշ",
    aliases: ["PSN", "social card number", "ՀԾՀ", "HCH"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234567890",
    sources: [
      "https://migration.mia.gov.am/en/acquiring-a-certificate-on-the-public-services-number-psn",
      "https://www.arlis.am/",
    ],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "AM_TIN",
    country: "AM",
    name: "Armenian Taxpayer Identification Number",
    localName: "Հարկ վճարողի հաշվառման համար",
    aliases: ["TIN", "ՀՎՀՀ", "HVHH"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "12345678",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Armenia-TIN.pdf",
      "https://www.src.am/en/taxpayerSearchSystemPage/112",
    ],
    normalize: digitsOnly,
    parse: (id) => ({ ok: true, data: { serial: id.slice(0, 7), extra: {} } }),
  },
];
