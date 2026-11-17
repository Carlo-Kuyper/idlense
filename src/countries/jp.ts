/**
 * Japan — Individual Number (My Number) and Corporate Number.
 *
 * My Number (個人番号): 12 digits, the 12th a check digit. Ordinance of the
 * Ministry of Internal Affairs and Communications No. 85 of 2014 (平成26年総務省令第85号),
 * Art. 5: with Pn the n-th digit from the right of the 11-digit body and
 * Qn = n + 1 (n ≤ 6) or n − 5 (n ≥ 7), r = Σ Pn·Qn mod 11; the check digit is
 * 0 when r ≤ 1, otherwise 11 − r. Left to right that is weights 6,5,4,3,2,7,6,5,4,3,2.
 * Nothing about the holder is encoded (no birth date, gender or region).
 *
 * Corporate Number (法人番号): 13 digits, the FIRST is the check digit.
 * Ordinance on the Designation of Corporate Numbers (法人番号の指定等に関する省令), as
 * published by the National Tax Agency:
 * with Pn the n-th digit from the right of the 12-digit body and Qn = 1 for odd n,
 * 2 for even n, the check digit is 9 − (Σ Pn·Qn mod 9). It is never 0.
 *
 * Codes reuse nationid's (`JP_MY_NUMBER`, `JP_CORPORATE_NUMBER`).
 *
 * Improves on upstream: the rules match nationid and idnumbers; nothing to fix
 * beyond idnumbers rejecting the conventional "1234 5678 9012" spacing.
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const MY_NUMBER_WEIGHTS = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function myNumberCheckDigit(body11: string): number {
  const r = weightedSum(body11, MY_NUMBER_WEIGHTS) % 11;
  return r <= 1 ? 0 : 11 - r;
}

/** Body is digits 2-13; weights 2,1,2,1,... from the left (1,2,1,2,... from the right). */
export function corporateCheckDigit(body12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += (body12.charCodeAt(i) - 48) * (i % 2 === 0 ? 2 : 1);
  return 9 - (sum % 9);
}

export const documents: DocumentSpec[] = [
  {
    code: "JP_MY_NUMBER",
    country: "JP",
    name: "Japanese Individual Number",
    localName: "個人番号 (マイナンバー)",
    aliases: ["My Number", "Individual Number", "kojin bango"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [12],
    pattern: /^\d{12}$/,
    example: "123456789018",
    sources: [
      "https://www.soumu.go.jp/kojinbango_card/",
      "https://www.digital.go.jp/policies/mynumber",
      "https://www.cao.go.jp/bangouseido/",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 4], " "),
    parse(id) {
      if (myNumberCheckDigit(id.slice(0, 11)) !== Number(id[11])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "JP_CORPORATE_NUMBER",
    country: "JP",
    name: "Japanese Corporate Number",
    localName: "法人番号",
    aliases: ["houjin bangou", "Corporate Number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: /^[1-9]\d{12}$/,
    example: "7000012050002",
    sources: [
      "https://www.houjin-bangou.nta.go.jp/setsumei/",
      "https://www.houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse(id) {
      if (corporateCheckDigit(id.slice(1)) !== Number(id[0])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(1), extra: {} } };
    },
  },
];
