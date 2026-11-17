/**
 * Venezuela — cédula, RIF and passport.
 *
 * - Cédula de identidad (SAIME): a letter and a correlative number,
 *   V-12345678 for Venezuelans and E-12345678 for foreign residents. No
 *   check digit; we accept 7 or 8 digits.
 * - RIF, Registro de Información Fiscal (SENIAT): letter + 8 digits + check
 *   digit, e.g. J-12345678-9. V/E RIFs are the holder's cédula padded to 8
 *   digits. Prefixes: V Venezuelan, E foreign resident, J legal person,
 *   P passport holder (non-resident), G government body.
 *   Check digit: letter value (V 4, E 8, J 12, P 16, G 20) + Σ digit ×
 *   (3,2,7,6,5,4,3,2); dv = 11 - (sum mod 11), 10 and 11 → 0.
 * - Passport (SAIME): 8 or 9 digits, no check digit on the printed number.
 *
 * Improves on upstream:
 * - idnumbers' cédula accepts the RIF-only prefixes J (legal person) and G
 *   (government), and 9-digit numbers; a cédula is V or E with ≤ 8 digits.
 * - nationid's RIF also accepts prefix C (consejo comunal) with letter value
 *   24, while the rifven crate uses 12. With no issuer source or real number
 *   to settle it, we reject C rather than guess (`invalid_format`).
 */
import { weightedSum } from "../core/algorithms.js";
import { compact } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const RIF_LETTER: Record<string, number> = { V: 4, E: 8, J: 12, P: 16, G: 20 };
const RIF_KIND: Record<string, string> = {
  V: "natural_person",
  E: "foreign_resident",
  J: "legal_person",
  P: "passport_holder",
  G: "government",
};

export function rifCheckDigit(letter: string, digits8: string): number | undefined {
  const lv = RIF_LETTER[letter];
  if (lv === undefined) return undefined;
  const dv = 11 - ((lv + weightedSum(digits8, [3, 2, 7, 6, 5, 4, 3, 2])) % 11);
  return dv >= 10 ? 0 : dv;
}

export const documents: DocumentSpec[] = [
  {
    code: "VE_CEDULA",
    country: "VE",
    name: "Venezuelan Identity Card Number",
    localName: "Cédula de identidad",
    aliases: ["CI", "cédula"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [8, 9],
    pattern: /^[VE]\d{7,8}$/,
    example: "V12345678",
    sources: ["http://www.saime.gob.ve/", "https://en.wikipedia.org/wiki/Venezuelan_identity_card"],
    upstream: ["idnumbers", "nationid"],
    normalize: compact,
    format: (c) => `${c[0]}-${c.slice(1)}`,
    parse: (id) => ({
      ok: true,
      data: { citizenship: id[0] === "V" ? "citizen" : "foreigner", serial: id.slice(1), extra: {} },
    }),
  },
  {
    code: "VE_RIF",
    country: "VE",
    name: "Venezuelan Fiscal Information Registry Number",
    localName: "Registro de Información Fiscal",
    aliases: ["RIF"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [10],
    pattern: /^[VEJPG]\d{9}$/,
    example: "J123456784",
    sources: ["http://www.seniat.gob.ve/", "https://en.wikipedia.org/wiki/National_identification_number#Venezuela"],
    upstream: ["idnumbers", "nationid"],
    normalize: compact,
    format: (c) => `${c[0]}-${c.slice(1, 9)}-${c[9]}`,
    parse(id) {
      if (rifCheckDigit(id[0]!, id.slice(1, 9)) !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
      const kind = RIF_KIND[id[0]!]!;
      const data = { serial: id.slice(1, 9), extra: { kind, checkDigit: Number(id[9]) } };
      if (id[0] === "V") return { ok: true, data: { ...data, citizenship: "citizen" } };
      if (id[0] === "E") return { ok: true, data: { ...data, citizenship: "foreigner" } };
      return { ok: true, data };
    },
  },
  {
    code: "VE_PASAPORTE",
    country: "VE",
    name: "Venezuelan Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [8, 9],
    pattern: /^\d{8,9}$/,
    example: "123456789",
    sources: ["http://www.saime.gob.ve/", "https://en.wikipedia.org/wiki/Venezuelan_passport"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
