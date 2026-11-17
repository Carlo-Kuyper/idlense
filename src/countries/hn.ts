/**
 * Honduras — DNI (Documento Nacional de Identificación), RTN and passport.
 *
 * DNI (RNP), 13 digits `DDMM-YYYY-NNNNN`:
 * - DD    department of birth (01-18); MM municipality of birth within it.
 * - YYYY  year the birth was registered with the RNP. Usually the birth
 *         year, but often the year after (and later for late registrations),
 *         so it is reported as `extra.registrationYear`, not `birthYear`.
 * - NNNNN volume and folio of the birth-register entry. No check digit.
 * Source: Sayari, "Interpreting Honduran National ID Numbers".
 *
 * RTN (SAR), 14 digits: for people the DNI plus one digit; companies get a
 * SAR-assigned number. No published check digit.
 *
 * Improves on upstream:
 * - DNI: nationid accepts any municipality 00-99 and any year up to 2099.
 *   We reject municipality codes beyond the department's count (298
 *   municipalities in total) and future birth years (`invalid_range` /
 *   `invalid_date`), and extract the registration year and department.
 * - nationid-style readers treat digits 5-8 as the birth year; they are the
 *   RNP registration year (Sayari), so we don't report `birthYear` or age.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Departments in RNP/INE numeric order with their municipality counts. */
export const HN_DEPARTMENTS: readonly (readonly [string, number])[] = [
  ["Atlántida", 8],
  ["Colón", 10],
  ["Comayagua", 21],
  ["Copán", 23],
  ["Cortés", 12],
  ["Choluteca", 16],
  ["El Paraíso", 19],
  ["Francisco Morazán", 28],
  ["Gracias a Dios", 6],
  ["Intibucá", 17],
  ["Islas de la Bahía", 4],
  ["La Paz", 19],
  ["Lempira", 28],
  ["Ocotepeque", 16],
  ["Olancho", 23],
  ["Santa Bárbara", 28],
  ["Valle", 9],
  ["Yoro", 11],
];

export const documents: DocumentSpec[] = [
  {
    code: "HN_DNI",
    country: "HN",
    name: "Honduran National Identity Number",
    localName: "Documento Nacional de Identificación",
    aliases: ["DNI", "tarjeta de identidad", "identidad"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [13],
    // dept 01-18, municipality 01-28, year 1900-2099
    pattern: /^(0[1-9]|1[0-8])(0[1-9]|1\d|2[0-8])(19|20)\d{7}$/,
    example: "0801199012345",
    sources: [
      "https://www.rnp.hn/",
      "https://learn.sayari.com/interpreting-honduran-national-id-numbers/",
      "https://en.wikipedia.org/wiki/Municipalities_of_Honduras",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 5], "-"),
    parse(id, { referenceDate }) {
      const entry = HN_DEPARTMENTS[Number(id.slice(0, 2)) - 1]!;
      if (Number(id.slice(2, 4)) > entry[1]) return { ok: false, reason: "invalid_range" };
      // Year the birth was registered with the RNP, not the birth year (Sayari).
      const registrationYear = Number(id.slice(4, 8));
      if (registrationYear > referenceDate.getFullYear()) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: { region: id.slice(0, 4), regionName: entry[0], serial: id.slice(8), extra: { registrationYear } },
      };
    },
  },
  {
    code: "HN_RTN",
    country: "HN",
    name: "Honduran National Tax Registry Number",
    localName: "Registro Tributario Nacional",
    aliases: ["RTN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [14],
    pattern: /^\d{14}$/,
    example: "08011990123456",
    sources: ["https://www.sar.gob.hn/"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 6], "-"),
    parse: (id) => (/^(\d)\1+$/.test(id) ? { ok: false, reason: "invalid_format" } : { ok: true, data: { extra: {} } }),
  },
  {
    code: "HN_PASAPORTE",
    country: "HN",
    name: "Honduran Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [7, 8, 9, 10],
    pattern: /^[A-Z]?\d{7,9}$/,
    example: "123456789",
    sources: ["https://inm.gob.hn/", "https://en.wikipedia.org/wiki/Honduran_passport"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
