/**
 * Croatia — OIB (personal identification number) and the old JMBG.
 *
 * OIB (Zakon o osobnom identifikacijskom broju, NN 60/2008): 11 digits, ten
 * random digits plus a check digit (ISO/IEC 7064 MOD 11,10 per the Pravilnik,
 * NN 1/2009). Issued to citizens, foreigners with a link to Croatia and legal
 * entities; it is also the tax number, and the EU VAT ID is `HR` + OIB (prefix stripped here). It encodes nothing.
 *
 * JMBG (Zakon o matičnom broju, NN 9/1992): the former-Yugoslav 13-digit
 * number (engine in ./rs.ts), Croatian register codes 30-39. Replaced by the
 * OIB in 2009 but still printed on older documents, hence `deprecated`.
 *
 * Improves on upstream: nothing to fix in the OIB check (nationid and
 * idnumbers agree with the law). Added: the old JMBG, which neither has for
 * Croatia.
 *
 * Ported from nationid and idnumbers (MIT).
 */
import { mod11_10Valid } from "../core/algorithms.js";
import { compact } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";
import { JMBG_SOURCES, jmbgCommon, parseJmbg } from "./rs.js";

export const documents: DocumentSpec[] = [
  {
    code: "HR_OIB",
    country: "HR",
    name: "Croatian Personal Identification Number",
    localName: "Osobni identifikacijski broj",
    aliases: ["OIB", "PIN", "VAT number", "PDV ID"],
    purpose: "identity",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "12345678903",
    sources: [
      "https://narodne-novine.nn.hr/clanci/sluzbeni/2008_05_60_2033.html",
      "https://narodne-novine.nn.hr/clanci/sluzbeni/2009_01_1_6.html",
      "https://www.porezna-uprava.hr/en/Pages/PIN.aspx",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: (s) => compact(s).replace(/^HR/, ""),
    parse: (id) => (mod11_10Valid(id) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
  {
    ...jmbgCommon,
    code: "HR_JMBG",
    country: "HR",
    name: "Croatian Master Citizen Number (pre-2009)",
    localName: "Jedinstveni matični broj građana",
    aliases: ["JMBG", "matični broj"],
    confidence: "high",
    deprecated: true,
    example: "0101990330000",
    sources: ["https://www.zakon.hr/cms.htm?id=35567", ...JMBG_SOURCES],
    upstream: [],
    parse: (id, ctx) => parseJmbg(id, ctx),
  },
];
