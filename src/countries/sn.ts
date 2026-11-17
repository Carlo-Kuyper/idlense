/**
 * Senegal — ECOWAS biometric ID card number, the NIN, and the NINEA.
 * No check algorithm is published for any of them, so all are shape-only.
 *
 * SN_CNI, the 17-digit number of the CEDEAO (ECOWAS) biometric identity card,
 * Décret 2016-1536 of 29 September 2016 (Journal Officiel):
 * - S         sex: 1 male, 2 female.
 * - RR        region code (no table published; returned raw).
 * - YYYYMMDD  date of birth.
 * - NNNNN     computer-generated serial.
 * - K         "dernier chiffre de contrôle calculé par l'ordinateur"; the
 *             algorithm isn't published, so it isn't verified.
 *
 * SN_NIN, the Numéro d'Identification National printed on the back of the card,
 * Décret 2005-787, art. 1: 13 characters, S CCC YYYY NNNNN:
 * - S     sex: 1 male, 2 female.
 * - CCC   civil-registry centre that recorded the birth. Since July 2012 a
 *         letter plus 2 digits (e.g. "1 G01 1985 00654"), before that 3 digits.
 * - YYYY  year the birth was registered (`extra.registrationYear`; usually,
 *         not always, the birth year). A future year is `invalid_range`.
 * - NNNNN registration number of the birth act.
 * The decree allows an optional "indice de différenciation" after the 13
 * characters but doesn't define it; we accept the 13-character form only.
 *
 * Both structures are in decrees (published in the Journal Officiel), copied
 * by ICNL and osiris.sn; not cross-checked against real cards, so `moderate`.
 *
 * SN_NINEA, the Numéro d'Identification National des Entreprises et
 * Associations (ANSD/DGID), for companies and self-employed people: a 7-digit
 * number (9 digits in newer notices, e.g. "NINEA n° 010079649" in JO 7892),
 * optionally followed by the 3-character COFI: tax regime digit (0, 1, 2), tax
 * centre letter, legal-form digit. python-stdnum describes a weighted check on
 * the base (weights 1,2,1,... mod 10); it holds for its example 3067221 and the
 * JO's 010079649 but fails an accounting firm's published example (0001122),
 * and no official source states it, so we don't apply it. Confidence `low`.
 */
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const NINEA_TAX_REGIME: Record<string, string> = {
  "0": "not_vat_liable",
  "1": "cgu",
  "2": "vat_liable",
};

export const documents: DocumentSpec[] = [
  {
    code: "SN_CNI",
    country: "SN",
    name: "Senegalese ECOWAS Biometric Identity Card Number",
    localName: "Numéro de la carte d'identité biométrique CEDEAO",
    aliases: ["CNI", "carte CEDEAO", "ECOWAS ID card"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [17],
    pattern: /^[12]\d{2}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{6}$/,
    example: "10119900101123456",
    sources: ["https://www.icnl.org/wp-content/uploads/Senegal_biometric.pdf"],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 2, 8, 5, 1], " "),
    parse(id, { referenceDate }) {
      const birth = birthFields(Number(id.slice(3, 7)), Number(id.slice(7, 9)), Number(id.slice(9, 11)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: id[0] === "1" ? "male" : "female",
          region: id.slice(1, 3),
          serial: id.slice(11, 16),
          extra: { checkDigit: id[16]! },
        },
      };
    },
  },
  {
    code: "SN_NIN",
    country: "SN",
    name: "Senegalese National Identification Number",
    localName: "Numéro d'Identification National",
    aliases: ["NIN"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [13],
    pattern: /^[12](\d{3}|[A-Z]\d{2})(1[89]|20)\d{2}\d{5}$/,
    example: "1G01198500654",
    sources: [
      "https://www.osiris.sn/Decret-no-2005-787-du-6-septembre.html",
      "https://www.osiris.sn/le-nin-de-la-carte-d-identite-numerisee-devient-alphanumerique.html",
    ],
    format: (c) => group(c, [1, 3, 4, 5], " "),
    parse(id, { referenceDate }) {
      const year = Number(id.slice(4, 8));
      if (year > referenceDate.getFullYear()) return { ok: false, reason: "invalid_range" };
      return {
        ok: true,
        data: {
          gender: id[0] === "1" ? "male" : "female",
          region: id.slice(1, 4),
          serial: id.slice(8),
          extra: { registrationYear: year },
        },
      };
    },
  },
  {
    code: "SN_NINEA",
    country: "SN",
    name: "Senegalese Business and Association Identification Number",
    localName: "Numéro d'Identification National des Entreprises et Associations",
    aliases: ["NINEA", "COFI"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [7, 9, 10, 12],
    pattern: /^(\d{7}|\d{9})([012][A-Z]\d)?$/,
    example: "30672212G2",
    sources: [
      "https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.sn.ninea",
      "https://nkac-audit.com/comprendre-le-ninea-votre-guide-de-lecture-simplifie/",
      "https://www.vie-publique.sn/docs/fa3d004b-8b0b-4d3c-bc09-7a50442da9e2/JO-7892-du-12-mars-2026.pdf",
    ],
    normalize: (s) => compact(s),
    format: (c) => (c.length === 10 || c.length === 12 ? `${c.slice(0, -3)} ${c.slice(-3)}` : c),
    parse(id) {
      const hasCofi = id.length === 10 || id.length === 12;
      const base = hasCofi ? id.slice(0, -3) : id;
      const extra: Record<string, string> = {};
      if (hasCofi) {
        const cofi = id.slice(-3);
        extra.cofi = cofi;
        extra.taxRegime = NINEA_TAX_REGIME[cofi[0]!]!;
        extra.taxCentre = cofi[1]!;
        extra.legalForm = cofi[2]!;
      }
      return { ok: true, data: { serial: base, extra } };
    },
  },
];
