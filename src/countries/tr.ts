/**
 * Turkey — T.C. Kimlik Numarası (TCKN), 11 digits: D1..D9 C10 C11.
 *
 * - D1 is never 0.
 * - C10 = (7 × (D1+D3+D5+D7+D9) − (D2+D4+D6+D8)) mod 10, taken as a
 *   non-negative remainder.
 * - C11 = (D1 + ... + D10) mod 10.
 * - Numbers starting with 99 are Yabancı Kimlik Numaraları: identity numbers
 *   the Göç İdaresi / NVİ assign to foreigners living or working in Turkey. They
 *   use the same check digits. They carry no citizenship (NVİ circular), so we
 *   report `citizenship: "foreigner"` for them and leave it unset otherwise.
 * The number encodes no date of birth, gender or place.
 *
 * Ported from idnumbers and personal-identity-validation.
 *
 * Improves on upstream:
 * - personal-identity-validation computes C10 with JavaScript's `%`, which is
 *   negative when 7 × odd-sum < even-sum, and so rejects valid numbers such
 *   as 19090909018.
 *   We use a non-negative remainder, as idnumbers does.
 * - Neither upstream tells foreigner (99-prefixed) numbers apart.
 */
import { digit } from "../core/algorithms.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** C10 and C11 for the first nine digits. */
export function tcknCheckDigits(body9: string): string {
  const odd = digit(body9, 0) + digit(body9, 2) + digit(body9, 4) + digit(body9, 6) + digit(body9, 8);
  const even = digit(body9, 1) + digit(body9, 3) + digit(body9, 5) + digit(body9, 7);
  const c10 = (((odd * 7 - even) % 10) + 10) % 10;
  let sum = c10;
  for (let i = 0; i < 9; i++) sum += digit(body9, i);
  return `${c10}${sum % 10}`;
}

export const documents: DocumentSpec[] = [
  {
    code: "TR_TCKN",
    country: "TR",
    name: "Turkish Identification Number",
    localName: "T.C. Kimlik Numarası",
    aliases: ["TCKN", "TC Kimlik No", "TC No", "Yabancı Kimlik Numarası", "YKN"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^[1-9]\d{10}$/,
    example: "10000000146",
    sources: [
      "https://www.nvi.gov.tr/",
      "https://www.nvi.gov.tr/kurumlar/nvi.gov.tr/mevzuat/nufusmevzuat/talimat/yabancilarakimliknumarasiverilmesiveadreskayitlarinintutulmasi.pdf",
      "https://tr.wikipedia.org/wiki/T.C._Kimlik_Numarası",
    ],
    upstream: ["idnumbers", "personal-identity-validation"],
    normalize: digitsOnly,
    parse(id) {
      if (tcknCheckDigits(id.slice(0, 9)) !== id.slice(9)) return { ok: false, reason: "invalid_checksum" };
      const foreigner = id.startsWith("99");
      return {
        ok: true,
        data: {
          ...(foreigner ? { citizenship: "foreigner" } : {}),
          extra: { kind: foreigner ? "yabanci-kimlik" : "tc-kimlik" },
        },
      };
    },
  },
];
