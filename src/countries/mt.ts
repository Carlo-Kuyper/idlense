/**
 * Malta — identity card number and VAT number.
 *
 * Identity card (Identità, Identity Cards Unit): 7 digits + a letter. For
 * people whose birth is registered in Malta the first five digits are the
 * birth registration number and the last two the year it was registered.
 * The letter gives the island and the century of registration:
 *   B Malta 1800s · M Malta 1900s · L Malta 2000s
 *   Z Gozo 1800s  · G Gozo 1900s  · H Gozo 2000s
 *   A foreign resident with a residence permit
 *   P Maltese citizen born abroad without a Maltese birth certificate
 * There is no check character. Numbers are often written without leading
 * zeros (`12345M`); we pad to 7 digits. The same number is the personal TIN.
 *
 * VAT: `MT` + 8 digits; Σ d·(3,4,6,7,8,9,10,1) ≡ 0 (mod 37).
 *
 * Improves on upstream: idnumbers has no Malta module and nationid only the
 * VAT number; the identity card is new here, from the issuer's own page.
 */
import { weightedSum } from "../core/algorithms.js";
import { compact } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const LETTERS: Record<string, { island?: string; century?: number; citizenship?: string }> = {
  B: { island: "Malta", century: 1800 },
  M: { island: "Malta", century: 1900 },
  L: { island: "Malta", century: 2000 },
  Z: { island: "Gozo", century: 1800 },
  G: { island: "Gozo", century: 1900 },
  H: { island: "Gozo", century: 2000 },
  A: { citizenship: "foreigner" },
  P: { citizenship: "citizen" },
};

export const documents: DocumentSpec[] = [
  {
    code: "MT_ID",
    country: "MT",
    name: "Maltese Identity Card Number",
    localName: "Numru tal-Karta tal-Identità",
    aliases: ["ID card", "e-ID", "TIN"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [8],
    pattern: /^\d{7}[ABGHLMPZ]$/,
    example: "0012345M",
    sources: ["https://identita.gov.mt/identity-cards-unit/useful-info/", "https://en.wikipedia.org/wiki/Maltese_identity_card"],
    normalize(input) {
      const c = compact(input);
      return /^\d{1,6}[A-Z]$/.test(c) ? c.padStart(8, "0") : c;
    },
    parse(id, { referenceDate }) {
      const info = LETTERS[id[7]!]!;
      const extra: Record<string, string | number | boolean> = {};
      let region: string | undefined;
      if (info.century !== undefined) {
        const year = info.century + Number(id.slice(5, 7));
        if (year > referenceDate.getFullYear()) return { ok: false, reason: "invalid_date" };
        extra.registrationYear = year;
        region = info.island;
      }
      return {
        ok: true,
        data: {
          ...(region ? { region } : {}),
          ...(info.citizenship ? { citizenship: info.citizenship } : {}),
          serial: id.slice(0, 5),
          extra,
        },
      };
    },
  },
  {
    code: "MT_VAT",
    country: "MT",
    name: "Maltese VAT Number",
    aliases: ["VAT ID"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^MT\d{8}$/,
    example: "MT11679112",
    sources: ["https://mtca.gov.mt/", "https://ec.europa.eu/taxation_customs/vies/"],
    upstream: ["nationid"],
    format: (c) => `MT ${c.slice(2)}`,
    parse: (id) =>
      weightedSum(id.slice(2), [3, 4, 6, 7, 8, 9, 10, 1]) % 37 === 0
        ? { ok: true, data: { extra: {} } }
        : { ok: false, reason: "invalid_checksum" },
  },
];
