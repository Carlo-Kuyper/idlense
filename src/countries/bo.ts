/**
 * Bolivia — cédula de identidad, NIT and passport. None has a published
 * check digit, so all three are shape-only.
 *
 * CI (SEGIP, Ley 145/2011): 6-9 digits, optionally followed by the
 * abbreviation of the department where it was issued ("expedido en"):
 * LP La Paz, CB Cochabamba, SC Santa Cruz, OR Oruro, PT Potosí,
 * CH Chuquisaca, TJ Tarija, BE Beni, PA Pando.
 *
 * NIT (Servicio de Impuestos Nacionales): 7-13 digits. Older NITs are
 * 7-11 digits; NITs for natural persons issued since 2021 are 13 digits
 * derived from the CI. SIN publishes no check-digit rule.
 *
 * Passport: Andean Community booklet, 6-9 alphanumerics, no check digit.
 *
 * Improves on upstream: extracts the issuing department (with name) from
 * the CI. Rules otherwise match nationid.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const BO_DEPARTMENTS: Record<string, string> = {
  LP: "La Paz",
  CB: "Cochabamba",
  SC: "Santa Cruz",
  OR: "Oruro",
  PT: "Potosí",
  CH: "Chuquisaca",
  TJ: "Tarija",
  BE: "Beni",
  PA: "Pando",
};

export const documents: DocumentSpec[] = [
  {
    code: "BO_CI",
    country: "BO",
    name: "Bolivian Identity Card Number",
    localName: "Cédula de Identidad",
    aliases: ["CI", "carnet de identidad"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [6, 7, 8, 9, 10, 11],
    pattern: /^\d{6,9}(LP|CB|SC|OR|PT|CH|TJ|BE|PA)?$/,
    example: "1234567LP",
    sources: [
      "https://www.segip.gob.bo/",
      "https://bolivia.infoleyes.com/norma/3121/ley-del-servicio-general-de-identificaci%C3%B3n-personal-y-del-servicio-general-de-licencias-para-conducir-145",
    ],
    upstream: ["nationid"],
    format: (c) => c.replace(/^(\d+)([A-Z]{2})$/, "$1 $2"),
    parse(id) {
      const m = /^(\d+)([A-Z]{2})?$/.exec(id)!;
      const region = m[2];
      return {
        ok: true,
        data: { serial: m[1], ...(region ? { region, regionName: BO_DEPARTMENTS[region] } : {}), extra: {} },
      };
    },
  },
  {
    code: "BO_NIT",
    country: "BO",
    name: "Bolivian Tax Identification Number",
    localName: "Número de Identificación Tributaria",
    aliases: ["NIT"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [7, 8, 9, 10, 11, 12, 13],
    pattern: /^\d{7,13}$/,
    example: "1023456789012",
    sources: ["https://www.impuestos.gob.bo/"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "BO_PASAPORTE",
    country: "BO",
    name: "Bolivian Passport Number",
    localName: "Pasaporte",
    aliases: ["passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [6, 7, 8, 9],
    pattern: /^[A-Z0-9]{6,9}$/,
    example: "AB1234567",
    sources: ["https://www.migracion.gob.bo/", "https://en.wikipedia.org/wiki/Bolivian_passport"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
