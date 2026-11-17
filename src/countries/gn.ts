/**
 * Guinea — NIFp (Numéro d'Identification Fiscale permanent), the taxpayer
 * number of the Direction Nationale des Impôts, for persons and companies.
 *
 * 9 digits, displayed XXX-XXX-XXX: 8 pseudo-random digits and a check digit
 * "déterminée en mettant en œuvre l'algorithme de Luhn" (DNI functional
 * specification for the NIFp, 30 November 2018, §8). The issuer publishes the
 * rule and it matches the documented sample, so confidence is `high`.
 *
 * Not covered:
 * - The establishment number (NIFp + 4-digit sequence + a new Luhn key): the
 *   specification's display mask and its description disagree on the length.
 * - The NPI (personal identification number, Décret D/2025/051): 18
 *   characters, 13 digits + 3 letters + a 2-digit key, but which positions
 *   hold the letters isn't published, so no pattern can be sourced.
 */
import { luhnValid } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "GN_NIFP",
    country: "GN",
    name: "Guinean Permanent Tax Identification Number",
    localName: "Numéro d'Identification Fiscale permanent",
    aliases: ["NIFp", "NIF"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "693770885",
    sources: [
      "https://dgi.gov.gn/wp-content/uploads/2022/09/N%C2%B0-12-Cahier-de-Charges-NIF-p.pdf",
      "https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.gn.nifp",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], "-"),
    parse(id) {
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(0, 8), extra: {} } };
    },
  },
];
