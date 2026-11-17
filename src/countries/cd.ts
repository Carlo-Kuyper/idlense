/**
 * DR Congo — voter-card national number and the DGI "Numéro Impôt". There is
 * no issued national ID card yet (ONIP's rollout is suspended), so the CENI
 * voter card serves as everyday ID. Neither number has a published check rule.
 *
 * CD_NN, the "numéro national (NN)" printed at the top right of the CENI voter
 * card. CENI's instructions for its polling-station SMS service and its CENI
 * RDC Mobile app (2024, reported by infos.cd and AllAfrica) describe it as 11
 * digits. Nothing is published about what the digits encode, so we check
 * the length only. Confidence `low` (press reports of CENI's instructions).
 *
 * CD_NIF, the Numéro Impôt (NIF) from the Direction Générale des Impôts
 * (Décret 03/012 of 2003). The DGI publishes no format; its own VAT leaflet
 * shows "A 0707219 F", and LookupTax notes that suppliers on the DGI's
 * approved list follow the same letter + 7 digits + letter pattern. That is an
 * observation, not a rule, so confidence is `low` and nothing is verified
 * beyond the shape. Issued to persons and companies.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "CD_NN",
    country: "CD",
    name: "Congolese Voter Card National Number",
    localName: "Numéro national (carte d'électeur)",
    aliases: ["NN", "numéro national", "carte d'électeur", "voter card"],
    purpose: "voter",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "12345678901",
    sources: [
      "https://infos.cd/?p=36195",
      "https://fr.allafrica.com/stories/202411040384.html",
      "https://irb-cisr.gc.ca/fr/renseignements-pays/rdi/Pages/index.aspx?doc=458935",
    ],
    normalize: digitsOnly,
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "CD_NIF",
    country: "CD",
    name: "Congolese Tax Number",
    localName: "Numéro Impôt (NIF)",
    aliases: ["NIF", "numéro d'identification fiscale", "numéro impôt"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [9],
    pattern: /^[A-Z]\d{7}[A-Z]$/,
    example: "A0707219F",
    sources: ["https://lookuptax.com/docs/country/dr-congo"],
    format: (c) => group(c, [1, 7, 1], " "),
    parse(id) {
      return { ok: true, data: { serial: id.slice(1, 8), extra: {} } };
    },
  },
];
