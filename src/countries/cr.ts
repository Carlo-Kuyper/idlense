/**
 * Costa Rica — identity and tax numbers. None carries a check digit; the TSE,
 * Migración and Hacienda verify numbers against their registries.
 *
 * - Cédula de identidad (persona física), TSE: 9 digits P-TTTT-AAAA.
 *   P is the province of registration: 1-7 the seven provinces, 8
 *   naturalised citizens, 9 "partida especial" (late registration / born
 *   abroad). Also the personal tax ID.
 * - Cédula jurídica, Registro Nacional: 10 digits X-XXX-XXXXXX. The first
 *   digit is the class: 2 central government (poderes del Estado), 3 private
 *   legal persons (3-101 sociedad anónima, 3-102 SRL, ...), 4 autonomous
 *   institutions (CCSS, INA, AyA, ...).
 * - NITE, Hacienda: 10 digits, 3-120-XXXXXX for natural persons and
 *   3-130-XXXXXX for entities without a cédula or DIMEX.
 * - DIMEX, Dirección General de Migración y Extranjería: 11 or 12 digits.
 * - Passport: 9 alphanumerics, no published structure.
 *
 * Improves on upstream:
 * - nationid accepts only class 3 for the cédula jurídica, so government
 *   bodies (2-100-042011, Ministerio de Seguridad Pública) and autonomous
 *   institutions (4-000-045127, INA) were rejected. We accept 2, 3 and 4.
 * - Adds the NITE (OECD TIN sheet for Costa Rica), which neither upstream has.
 * - Extracts the province (with name) from the cédula física, as idnumbers
 *   does, and the class of a cédula jurídica.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Province digit of the cédula física (TSE; idnumbers). */
export const CR_PROVINCES: Record<string, string> = {
  "1": "San José",
  "2": "Alajuela",
  "3": "Cartago",
  "4": "Heredia",
  "5": "Guanacaste",
  "6": "Puntarenas",
  "7": "Limón",
  "8": "Naturalized citizen",
  "9": "Partida especial",
};

const JURIDICA_CLASS: Record<string, string> = {
  "2": "government",
  "3": "legal_person",
  "4": "autonomous_institution",
};

const OECD_TIN =
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Costa-Rica-TIN.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "CR_CEDULA_FISICA",
    country: "CR",
    name: "Costa Rican Identity Card Number",
    localName: "Cédula de identidad",
    aliases: ["cédula física", "cédula de identidad"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [9],
    pattern: /^[1-9]\d{8}$/,
    example: "112345678",
    sources: ["https://www.tse.go.cr/", OECD_TIN, "https://en.wikipedia.org/wiki/Costa_Rican_identity_card"],
    upstream: ["idnumbers", "nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 4, 4], "-"),
    parse(id) {
      const p = id[0]!;
      const data = {
        region: p,
        regionName: CR_PROVINCES[p],
        serial: id.slice(1),
        extra: { tomo: id.slice(1, 5), asiento: id.slice(5) } as Record<string, string>,
      };
      if (p === "8") return { ok: true, data: { ...data, citizenship: "naturalized_citizen" } };
      return { ok: true, data: { ...data, citizenship: "citizen" } };
    },
  },
  {
    code: "CR_DIMEX",
    country: "CR",
    name: "Costa Rican Foreigner Identity Document",
    localName: "Documento de Identidad Migratorio para Extranjeros",
    aliases: ["DIMEX"],
    purpose: "migratory",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [11, 12],
    pattern: /^\d{11,12}$/,
    example: "155812345678",
    sources: ["https://www.migracion.go.cr/", OECD_TIN],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { citizenship: "foreigner", extra: {} } }),
  },
  {
    code: "CR_CEDULA_JURIDICA",
    country: "CR",
    name: "Costa Rican Legal Entity Number",
    localName: "Cédula jurídica",
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "high",
    lengths: [10],
    pattern: /^[234]\d{9}$/,
    example: "3101123456",
    sources: ["https://www.registronacional.go.cr/", OECD_TIN],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 3, 6], "-"),
    parse: (id) => ({
      ok: true,
      data: { serial: id.slice(4), extra: { kind: JURIDICA_CLASS[id[0]!]!, entityType: id.slice(1, 4) } },
    }),
  },
  {
    code: "CR_NITE",
    country: "CR",
    name: "Costa Rican Special Tax Identification Number",
    localName: "Número de Identificación Tributario Especial",
    aliases: ["NITE"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^31[23]0\d{6}$/,
    example: "3120123456",
    sources: [OECD_TIN, "https://www.hacienda.go.cr/"],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 3, 6], "-"),
    parse: (id) => ({
      ok: true,
      data: { serial: id.slice(4), extra: { kind: id[2] === "2" ? "natural_person" : "entity" } },
    }),
  },
  {
    code: "CR_PASAPORTE",
    country: "CR",
    name: "Costa Rican Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [9],
    pattern: /^[A-Z0-9]{9}$/,
    example: "C12345678",
    sources: ["https://www.migracion.go.cr/", "https://en.wikipedia.org/wiki/Costa_Rican_passport"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
