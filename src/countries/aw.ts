/**
 * Aruba — population-register identity number and DIMP persoonsnummer (TIN).
 *
 * AW_ID, the identiteitsnummer issued by the Burgerlijke Stand en
 * Bevolkingsregister (civil registry): YYYY.MM.DD.NN, the date of birth then a
 * 2-digit sequence number. The only source is the Aruban government's guidance
 * for the employer personnel register, which gives the example 1965.12.12.40.
 * Its text calls the number "acht cijfers (jaar/maand/dag/nummer)" although
 * the example has ten, so confidence is `low`: we follow the example. Nothing
 * about gender or a check digit is published.
 *
 * AW_PERSOONSNUMMER, the tax number issued on request by the Departamento di
 * Impuesto (DIMP) to people and entities, all digits, no published structure.
 * Aruba's OECD TIN sheet (2017) says 8 digits; the government's 2022
 * personnel-register guidance says 7. We accept both. Confidence `low`.
 */
import { birthFields } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const PERSONNEL_REGISTER =
  "https://cuatro.sim-cdn.nl/arubaoverheid2858bd/uploads/toelichting-personeelsregister-2022-2023-def1.0.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "AW_ID",
    country: "AW",
    name: "Aruban Identity Number",
    localName: "Identiteitsnummer",
    aliases: ["ID-nummer", "cedula number", "persoonsnummer bevolkingsregister"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{2}$/,
    example: "1990010112",
    sources: [PERSONNEL_REGISTER],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}`,
    parse(id, { referenceDate }) {
      const birth = birthFields(Number(id.slice(0, 4)), Number(id.slice(4, 6)), Number(id.slice(6, 8)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return { ok: true, data: { ...birth, serial: id.slice(8), extra: {} } };
    },
  },
  {
    code: "AW_PERSOONSNUMMER",
    country: "AW",
    name: "Aruban Tax Identification Number",
    localName: "Persoonsnummer",
    aliases: ["DIMP persoonsnummer", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [7, 8],
    pattern: /^\d{7,8}$/,
    example: "12345678",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Aruba-TIN.pdf",
      PERSONNEL_REGISTER,
      "https://cuatro.sim-cdn.nl/arubaoverheid2858bd/uploads/toelichting-personeelsbehoefte-projecten-formulier-def1.0-1.pdf",
    ],
    normalize: digitsOnly,
    parse(id) {
      return { ok: true, data: { serial: id, extra: {} } };
    },
  },
];
