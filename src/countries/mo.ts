/**
 * Macao — Resident Identity Card number (BIR, Bilhete de Identidade de
 * Residente): eight digits written NNNNNNN(C), e.g. 1234567(8).
 *
 * Administrative Regulation 23/2002 says the number is seven digits followed
 * by a control digit, but the control-digit algorithm has never been
 * published, so only the shape is checked (`checksum: false`). The first
 * digit is the issuing series. idnumbers accepts 0, 1, 5, 7 and 8 there and
 * labels them (commercial individual, first generation, civil authority,
 * public security police, entity); those labels come from a tax-number
 * aggregator, not the issuer, so we keep the accepted set but only return the
 * raw digit as `extra.series`.
 *
 * Improves on upstream (idnumbers): no logic changes; the upstream labels for
 * the first digit are not repeated because no issuer source supports them.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "MO_BIR",
    country: "MO",
    name: "Macao Resident Identity Card Number",
    localName: "Bilhete de Identidade de Residente / 澳門居民身份證",
    aliases: ["BIR", "BIRP", "BIRNP", "Macau ID card"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [8],
    pattern: /^[01578]\d{7}$/,
    example: "52154328",
    sources: [
      "https://images.io.gov.mo/bo/i/2002/44/rega-23-2002.pdf",
      "https://en.wikipedia.org/wiki/Macau_Resident_Identity_Card",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 7)}(${c[7]})`,
    parse: (id) => ({ ok: true, data: { serial: id.slice(1, 7), extra: { series: id[0]!, controlDigit: id[7]! } } }),
  },
];
