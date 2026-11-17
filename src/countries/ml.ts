/**
 * Mali — NINA (Numéro d'Identification Nationale), Décret 06-442/P-RM of
 * 18 October 2006, art. 1: 14 digits and a check letter "de l'alphabet
 * français", issued to both natural and legal persons.
 * - Natural person: nationality (1), sex (1), year of birth (2), birth
 *   locality (7), sequence (3), key letter.
 * - Legal person: legal form (1), legal status (1), year of creation (2),
 *   locality (7), sequence (3), key letter.
 * The decree doesn't publish the code values for the first two digits, the
 * locality table, or how the key letter is computed, and the number alone
 * doesn't say whether it belongs to a person or an entity. So we only check
 * the shape and return the segments raw (`region` = locality code). The
 * two-digit year isn't turned into a birth year for the same reason.
 * The structure is in a decree (from the government's 2012 compilation of
 * texts on FAOLEX), not cross-checked against real numbers: `moderate`.
 *
 * Not covered: the NIF. We found only a thesis mention and one illustrative
 * example, no rule.
 */
import { compact, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "ML_NINA",
    country: "ML",
    name: "Malian National Identification Number",
    localName: "Numéro d'Identification Nationale",
    aliases: ["NINA"],
    purpose: "identity",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [15],
    pattern: /^\d{14}[A-Z]$/,
    example: "11901234567001K",
    sources: ["https://faolex.fao.org/docs/pdf/Mli176233.pdf"],
    normalize: (s) => compact(s),
    format: (c) => group(c, [1, 1, 2, 7, 3, 1], " "),
    parse(id) {
      return {
        ok: true,
        data: {
          region: id.slice(4, 11),
          serial: id.slice(11, 14),
          extra: { firstCode: id[0]!, secondCode: id[1]!, yearDigits: id.slice(2, 4), keyLetter: id[14]! },
        },
      };
    },
  },
];
