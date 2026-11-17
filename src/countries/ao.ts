/**
 * Angola — Bilhete de Identidade (BI) number, which is also the citizen's NIF.
 *
 * 14 characters: 9 digits, 2 letters, 3 digits (e.g. the illustrative
 * 000000000LA000). Under the NIF decree (Decreto Presidencial 245/21), "O NIF
 * dos cidadãos nacionais corresponde ao seu número do Bilhete de Identidade",
 * so the same number is used for tax.
 *
 * The letters are widely understood to identify the province of issue (LA for
 * Luanda), but we found no official table, so we return them raw in
 * `extra.letterCode` and don't name a region. No check-digit rule is
 * published. The format comes from one secondary source that took it from
 * AGT's documents, so confidence is `low`.
 *
 * Not modelled: company and foreigner NIFs. AGT assigns them sequentially and
 * publishes no format (most company NIFs seen have 10 digits starting with 5,
 * but "most" isn't a rule).
 */
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "AO_BI",
    country: "AO",
    name: "Angolan Identity Card Number",
    localName: "Bilhete de Identidade",
    aliases: ["BI", "NIF", "Número de Identificação Fiscal", "número do BI"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [14],
    pattern: /^\d{9}[A-Z]{2}\d{3}$/,
    example: "123456789LA012",
    sources: [
      "https://lookuptax.com/docs/tax-identification-number/angola-tax-id-guide",
      "https://lookuptax.com/validate/angola/nif",
    ],
    parse(id) {
      return { ok: true, data: { serial: id.slice(0, 9), extra: { letterCode: id.slice(9, 11) } } };
    },
  },
];
