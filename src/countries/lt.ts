/**
 * Lithuania — asmens kodas, juridinio asmens kodas and PVM (VAT) code.
 *
 * Asmens kodas, 11 digits: G YYMMDD SSS C (Law on the Population Register,
 * art. 8; structure as published by the State Tax Inspectorate in the OECD
 * TIN sheet).
 * - G 1-6: 1/2 → 1800s, 3/4 → 1900s, 5/6 → 2000s; odd male, even female.
 * - C two-pass mod 11 (weights 1..9,1 then 3..9,1,2,3; a second 10 gives 0),
 *   the same rule as Estonia.
 *
 * Juridinio asmens kodas (legal entity code), 9 digits: 8 digits + check
 * digit Σ d·(1..8) mod 11; remainder 10 is never issued (the registry draws
 * another code).
 *
 * PVM mokėtojo kodas (VAT), `LT` + 9 digits (legal persons) or 12 digits
 * (temporarily registered / natural persons). The second-to-last digit is
 * always 1; the last is the two-pass mod 11 check digit over the rest.
 *
 * Improves on upstream:
 * - idnumbers accepts G = 0 (1700s) and 7-9 (2100s); the law defines only 1-6.
 * - idnumbers accepts birth dates in the future.
 * - nationid's LT_VAT expects the fixed `1` one position too early (7th of 9,
 *   10th of 12 digits), so it rejects real VAT codes such as LT119511515; we
 *   check the second-to-last digit.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";
import { balticCenturyGender, balticCheckDigit } from "./ee.js";

function normalizeVat(input: string): string {
  const c = compact(input);
  return /^(\d{9}|\d{12})$/.test(c) ? "LT" + c : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "LT_ASMENS_KODAS",
    country: "LT",
    name: "Lithuanian Personal Code",
    localName: "Asmens kodas",
    aliases: ["AK", "personal code", "personal identification number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^[1-6]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{4}$/,
    example: "38001010009",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/lithuania-tin.pdf",
      "https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.2507/asr",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const cg = balticCenturyGender(Number(id[0]));
      if (!cg) return { ok: false, reason: "invalid_format" };
      const birth = birthFields(cg.century + Number(id.slice(1, 3)), Number(id.slice(3, 5)), Number(id.slice(5, 7)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (balticCheckDigit(id.slice(0, 10)) !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { ...birth, gender: cg.gender, serial: id.slice(7, 10), extra: {} } };
    },
  },
  {
    code: "LT_JAK",
    country: "LT",
    name: "Lithuanian Legal Entity Code",
    localName: "Juridinio asmens kodas",
    aliases: ["JAK", "company code", "įmonės kodas"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "110053842",
    sources: ["https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/lithuania-tin.pdf"],
    normalize: digitsOnly,
    parse(id) {
      const r = weightedSum(id, [1, 2, 3, 4, 5, 6, 7, 8]) % 11;
      if (r === 10) return { ok: false, reason: "invalid_range" };
      if (r !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "LT_VAT",
    country: "LT",
    name: "Lithuanian VAT Number",
    localName: "PVM mokėtojo kodas",
    aliases: ["PVM", "VAT"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [11, 14],
    // second-to-last digit is always 1
    pattern: /^LT(\d{7}|\d{10})1\d$/,
    example: "LT119511515",
    sources: [
      "https://www.vmi.lt/evmi/en/pvm-moketoju-registravimas",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize: normalizeVat,
    format: (c) => `LT ${c.slice(2)}`,
    parse(id) {
      const body = id.slice(2);
      if (balticCheckDigit(body.slice(0, -1)) !== Number(body[body.length - 1])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: { kind: body.length === 9 ? "legal_person" : "temporary_or_natural_person" } } };
    },
  },
];
