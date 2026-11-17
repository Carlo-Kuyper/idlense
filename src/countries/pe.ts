/**
 * Peru — DNI, RUC, carné de extranjería and passport.
 *
 * DNI (RENIEC): 8 digits. The card also prints a verification character
 * after the number, but RENIEC doesn't publish how it's computed and the
 * stored/quoted number is the 8 digits alone, so only the shape is checked.
 *
 * RUC (SUNAT): 11 digits = 2-digit taxpayer type + 8 digits + check digit.
 * - 10 natural person with DNI (10 + DNI + check digit)
 * - 15 natural person with another identity document
 * - 16 no longer issued (legacy registrations)
 * - 17 an old RUC from 1993-2000, or a foreigner / other (Oracle's Peru
 *      tax docs; earlier we labelled both 16 and 17 "non_domiciled")
 * - 20 legal entity
 * Check digit: Σ digit·(5,4,3,2,7,6,5,4,3,2), c = 11 - Σ mod 11; c = 10 → 0,
 * c = 11 → 1.
 *
 * Carné de extranjería (Migraciones): numeric, 9-12 digits, no published
 * check digit.
 *
 * Passport: no check digit on the printed number.
 *
 * Improves on upstream:
 * - nationid maps 10 → 1 and 11 → 0 in the RUC check digit; SUNAT's rule
 *   is the reverse (10 → 0, 11 → 1). nationid therefore rejects every
 *   valid RUC whose remainder is 0 or 1 and accepts the wrong digit instead.
 * - For prefix 10 the embedded DNI is extracted.
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** SUNAT RUC check digit for the first 10 digits. */
export function peRucCheckDigit(body: string): number {
  const c = 11 - (weightedSum(body, [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]) % 11);
  return c === 10 ? 0 : c === 11 ? 1 : c;
}

const RUC_KIND: Record<string, string> = {
  "10": "natural_person_dni",
  "15": "natural_person_other_id",
  "16": "legacy",
  "17": "legacy_or_foreigner",
  "20": "legal_entity",
};

export const documents: DocumentSpec[] = [
  {
    code: "PE_DNI",
    country: "PE",
    name: "Peruvian National Identity Document Number",
    localName: "Documento Nacional de Identidad",
    aliases: ["DNI", "DNIe"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "12345678",
    sources: ["https://www.gob.pe/reniec", "https://en.wikipedia.org/wiki/National_identification_number#Peru"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse: (id) => ({ ok: true, data: { serial: id, extra: {} } }),
  },
  {
    code: "PE_RUC",
    country: "PE",
    name: "Peruvian Taxpayer Registry Number",
    localName: "Registro Único de Contribuyentes",
    aliases: ["RUC"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [11],
    pattern: /^(10|15|16|17|20)\d{9}$/,
    example: "20131312955",
    sources: [
      "https://orientacion.sunat.gob.pe/ruc-empresas",
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Peru-TIN.pdf",
      "https://lookuptax.com/docs/es/numero-identificacion-fiscal/guia-ruc-peru",
      "https://docs.oracle.com/en/cloud/saas/financials/24a/faitx/peru.html",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 2)}-${c.slice(2, 10)}-${c[10]}`,
    parse(id) {
      if (peRucCheckDigit(id) !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
      const prefix = id.slice(0, 2);
      const extra: Record<string, string> = { kind: RUC_KIND[prefix]! };
      if (prefix === "10") extra.dni = id.slice(2, 10);
      return { ok: true, data: { serial: id.slice(2, 10), extra } };
    },
  },
  {
    code: "PE_CE",
    country: "PE",
    name: "Peruvian Foreigner's Card Number",
    localName: "Carné de Extranjería",
    aliases: ["CE", "carnet de extranjería"],
    purpose: "migratory",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [9, 10, 11, 12],
    pattern: /^\d{9,12}$/,
    example: "000001234567",
    sources: ["https://www.gob.pe/migraciones"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { citizenship: "foreigner", extra: {} } }),
  },
  {
    code: "PE_PASAPORTE",
    country: "PE",
    name: "Peruvian Passport Number",
    localName: "Pasaporte",
    aliases: ["passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [8, 9, 10],
    pattern: /^[A-Z]?\d{8,9}$/,
    example: "A123456789",
    sources: ["https://www.gob.pe/migraciones", "https://es.wikipedia.org/wiki/Pasaporte_peruano"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
