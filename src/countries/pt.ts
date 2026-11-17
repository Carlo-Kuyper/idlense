/**
 * Portugal — NIF/NIPC (tax number) and Cartão de Cidadão document number.
 *
 * NIF / NIPC: 9 digits (Autoridade Tributária). Check digit: r = Σ d·(9..2)
 * mod 11 over the first 8 digits; r < 2 → 0, else 11 - r. The leading digit
 * (or two) gives the holder type:
 *   1, 2, 3 resident individual · 45 non-resident individual · 5 company ·
 *   6 public body · 70, 74, 75 estates · 71 non-resident company ·
 *   72 investment fund · 77 NIF assigned ex officio · 79 Expo 98 regime ·
 *   8 sole trader (legacy) · 90, 91 condominiums / irregular companies ·
 *   98 non-resident without permanent establishment · 99 civil partnership.
 *
 * Cartão de Cidadão: 8-digit civil ID number (NIC) + its check digit +
 * 2-character version + document check digit, e.g. `00000000 0 ZZ4` (AMA's
 * specimen). Validation (AMA, "Validação de Número de Documento do Cartão de
 * Cidadão"): map 0-9 → 0-9 and A-Z → 10-35, then from the right double every
 * second value (subtracting 9 when it exceeds 9) and sum; the total must be a
 * multiple of 10.
 *
 * Improves on upstream:
 * - idnumbers checks the Cartão de Cidadão with two mod-11 digits over the
 *   wrong positions, so it rejects every real card (including AMA's specimen
 *   000000000ZZ4); nationid checks the shape only. We implement AMA's rule.
 * - Both upstreams accept NIF prefixes the tax authority never assigns
 *   (0, 4 other than 45, 73, 76, 78, 92-97); rejected as `invalid_range`.
 *   idnumbers also accepts 000000000.
 */
import { alnumValue, weightedSum } from "../core/algorithms.js";
import { group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const NIF_HOLDER: [prefix: string, kind: string][] = [
  ["1", "individual"], ["2", "individual"], ["3", "individual"],
  ["45", "non_resident_individual"],
  ["5", "company"], ["6", "public_body"],
  ["70", "estate"], ["71", "non_resident_company"], ["72", "investment_fund"],
  ["74", "estate"], ["75", "estate"], ["77", "ex_officio"], ["79", "expo98"],
  ["8", "sole_trader"],
  ["90", "condominium_or_irregular_company"], ["91", "condominium_or_irregular_company"],
  ["98", "non_resident"], ["99", "civil_partnership"],
];

const PERSON_KINDS = new Set(["individual", "non_resident_individual", "sole_trader"]);

export function nifCheckDigit(id: string): number {
  const r = weightedSum(id, [9, 8, 7, 6, 5, 4, 3, 2]) % 11;
  return r < 2 ? 0 : 11 - r;
}

/** AMA's Cartão de Cidadão document-number check. */
export function ccValid(id: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = id.length - 1; i >= 0; i--) {
    let v = alnumValue(id[i]!);
    if (v < 0) return false;
    if (double) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
    double = !double;
  }
  return sum % 10 === 0;
}

export const documents: DocumentSpec[] = [
  {
    code: "PT_NIF",
    country: "PT",
    name: "Portuguese Tax Identification Number",
    localName: "Número de Identificação Fiscal",
    aliases: ["NIF", "NIPC", "contribuinte", "VAT"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456789",
    sources: [
      "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Pages/faqs-00187.aspx",
      "https://pt.wikipedia.org/wiki/N%C3%BAmero_de_identifica%C3%A7%C3%A3o_fiscal",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize: (s) => s.replace(/^\s*PT/i, "").replace(/\D/g, ""),
    format: (c) => group(c, [3, 3, 3], " "),
    parse(id) {
      const kind = NIF_HOLDER.find(([p]) => id.startsWith(p))?.[1];
      if (!kind) return { ok: false, reason: "invalid_range" };
      if (nifCheckDigit(id) !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: { holderType: kind, person: PERSON_KINDS.has(kind) } } };
    },
  },
  {
    code: "PT_CC",
    country: "PT",
    name: "Portuguese Citizen Card Number",
    localName: "Cartão de Cidadão",
    aliases: ["CC", "citizen card", "NIC", "BI"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [12],
    pattern: /^\d{9}[A-Z0-9]{2}\d$/,
    example: "000000000ZZ4",
    sources: [
      "https://www.autenticacao.gov.pt/documents/20126/0/Valida%C3%A7%C3%A3o+de+N%C3%BAmero+de+Documento+do+Cart%C3%A3o+de+Cidad%C3%A3o+(1).pdf",
      "https://www.cartaodecidadao.pt/",
    ],
    upstream: ["nationid", "idnumbers"],
    format: (c) => `${c.slice(0, 8)} ${c[8]} ${c.slice(9)}`,
    parse(id) {
      if (!ccValid(id)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(0, 8), extra: { version: id.slice(9, 11) } } };
    },
  },
];
