/**
 * Suriname — identiteitsnummer (ID-nummer) and fiscaal identificatienummer (FIN).
 *
 * SR_ID: the unique administrative number on the ID card issued by the
 * Centraal Bureau voor Burgerzaken (CBB). Id-kaartenwet 2018 (S.B. 2019
 * no. 16), explanatory memorandum: "bestaande uit acht alfanumerieke
 * karakters, waarvan de eerste twee alfabetisch en de laatste zes numeriek
 * zijn". It is not the card number. Nothing else about the structure is
 * published, so this is a shape check.
 *
 * SR_FIN: Wet Fiscaal Identificatienummer (S.B. 2020 no. 17) art. 2: an
 * 8-digit number that "bevat geen informatie over de belastingplichtige".
 * S.B. 2024 no. 74 dropped the digit count from the law because the
 * Belastingdienst's Multi Tax System works with 10-digit numbers. We accept
 * 8 or 10 digits; confidence low until the 10-digit format is confirmed.
 * Real-world evidence for 10 digits: Assuria Schadeverzekering N.V.'s
 * published VAT certificate shows FIN 2000002293.
 *
 * No upstream library has either.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "SR_ID",
    country: "SR",
    name: "Surinamese Identity Number",
    localName: "Identiteitsnummer",
    aliases: ["ID-nummer", "ID-kaart nummer"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [8],
    pattern: /^[A-Z]{2}\d{6}$/,
    example: "AB123456",
    sources: ["https://www.dna.sr/media/kiwf1wtw/sb_2019___16.pdf", "https://gov.sr/thema/cbb/"],
    parse: (id) => ({ ok: true, data: { serial: id.slice(2), extra: { prefix: id.slice(0, 2) } } }),
  },
  {
    code: "SR_FIN",
    country: "SR",
    name: "Surinamese Tax Identification Number",
    localName: "Fiscaal identificatienummer",
    aliases: ["FIN", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [8, 10],
    pattern: /^\d{8}(?:\d{2})?$/,
    example: "1234567890",
    sources: [
      "https://www.dna.sr/media/v0hlyfgl/sb_2020___17.pdf",
      "https://www.sris.sr/wp-content/uploads/2024/07/S.B.-2024-no.-74-WET-houdende-wijziging-van-regels-ter-toekenning-van-fiscaal-identificatienummers.pdf",
      "https://www.assuria.sr/media/d2mpzdea/btw-certificaat-assuria-schadeverzekering-n-v.pdf",
    ],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
