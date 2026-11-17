/**
 * Algeria — NIN (Numéro d'Identification National) and the tax NIF.
 *
 * DZ_NIN, the 18-digit national identification number created by Décret
 * exécutif 10-210 (JORADP 54/2010; replaced in 2023, JORADP 60/2023, which
 * keeps the 18 digits and "une clé de contrôle"). The Interior Ministry's
 * ID4Africa 2019 presentation gives the segments, in order:
 * - AA    (2) status: sex, birth-act mention (bis/ter/quater/presumed), born in
 *             Algeria or abroad, naturalisation. No code table is published,
 *             so it is returned raw in `extra.statusCode` and no gender is set.
 * - YYY   (3) last three digits of the year the birth was registered (not
 *             necessarily the birth year): `extra.registrationYearDigits`.
 * - CCCC  (4) birth commune code, or country code when born abroad (`region`).
 * - NNNNN (5) birth-act number (`serial`).
 * - SS    (2) register series within the year.
 * - KK    (2) control key. The algorithm is not published, so it isn't
 *             verified.
 * Shape-only. One issuer presentation, not cross-checked against real numbers,
 * so confidence `moderate`.
 *
 * DZ_NIF, the Numéro d'Identification Fiscale from the DGI: 15 digits, or 20
 * for secondary establishments. No published check digit. Claims that it
 * encodes the wilaya or legal form come only from blogs, so nothing else is
 * extracted. Confidence `moderate`.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "DZ_NIN",
    country: "DZ",
    name: "Algerian National Identification Number",
    localName: "رقم التعريف الوطني / Numéro d'Identification National",
    aliases: ["NIN", "NNI", "numéro national"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [18],
    pattern: /^\d{18}$/,
    example: "109850160012340145",
    sources: [
      "https://www.id4africa.com/2019_event/presentations/InF3/4-Abderrazak-Henni-MOI-Algeria.pdf",
      "https://www.joradp.dz/FTP/jo-francais/2010/F2010054.pdf",
      "https://algerie-eco.com/?p=176249",
    ],
    normalize: digitsOnly,
    parse(id) {
      return {
        ok: true,
        data: {
          region: id.slice(5, 9),
          serial: id.slice(9, 14),
          extra: {
            statusCode: id.slice(0, 2),
            registrationYearDigits: id.slice(2, 5),
            registerSeries: id.slice(14, 16),
            controlKey: id.slice(16),
          },
        },
      };
    },
  },
  {
    code: "DZ_NIF",
    country: "DZ",
    name: "Algerian Tax Identification Number",
    localName: "رقم التعريف الجبائي / Numéro d'Identification Fiscale",
    aliases: ["NIF"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [15, 20],
    pattern: /^\d{15}(\d{5})?$/,
    example: "416001000000007",
    sources: ["https://www.mfdgi.gov.dz/", "https://arthurdejong.org/python-stdnum/doc/2.1/stdnum.dz.nif"],
    normalize: digitsOnly,
    parse(id) {
      return { ok: true, data: { extra: { secondaryEstablishment: id.length === 20 } } };
    },
  },
];
