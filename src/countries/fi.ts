/**
 * Finland — henkilötunnus (HETU), Y-tunnus and VAT number.
 *
 * HETU: DDMMYY C NNN Q, 11 characters (DVV).
 * - C century sign: `+` 1800s; `-` and (from 2023) `Y X W V U` 1900s;
 *   `A` and (from 2023) `B C D E F` 2000s. The new signs were added by
 *   Valtioneuvoston asetus 2022 to stop the number space running out; the
 *   sign is part of the identifier and is not in the check character.
 * - NNN individual number 002-899; odd for men, even for women. 900-999 are
 *   temporary numbers assigned outside the population register.
 * - Q check character: (DDMMYYNNN as an integer) mod 31, mapped onto
 *   0-9 A-Y without G I O Q Z.
 *
 * Y-tunnus (business ID): 7 digits + check digit, weights 7,9,10,5,8,4,2,
 * r = Σ mod 11; r = 0 → 0, r = 1 → never issued, else 11 - r.
 * VAT: `FI` + the 8 digits of the Y-tunnus.
 *
 * Improves on upstream:
 * - Both upstreams accept future birth dates (idnumbers takes 131052A308T as
 *   2052); rejected as `invalid_date`.
 * - nationid accepts impossible dates (300252-...) and individual numbers
 *   000/001; both upstreams accept the temporary range 900-999. Those are
 *   `invalid_date` / `invalid_range`.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { compactKeeping } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const CHECK_CHARS = "0123456789ABCDEFHJKLMNPRSTUVWXY";

export const FI_CENTURY: Record<string, number> = {
  "+": 1800,
  "-": 1900, Y: 1900, X: 1900, W: 1900, V: 1900, U: 1900,
  A: 2000, B: 2000, C: 2000, D: 2000, E: 2000, F: 2000,
};

const YT_WEIGHTS = [7, 9, 10, 5, 8, 4, 2];

export function ytunnusValid(d: string): boolean {
  const r = weightedSum(d, YT_WEIGHTS) % 11;
  if (r === 1) return false;
  return (r === 0 ? 0 : 11 - r) === Number(d[7]);
}

export const documents: DocumentSpec[] = [
  {
    code: "FI_HETU",
    country: "FI",
    name: "Finnish Personal Identity Code",
    localName: "Henkilötunnus",
    aliases: ["HETU", "personbeteckning", "personal identity code"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{2}[-+A-FU-Y]\d{3}[0-9A-FHJ-NPR-Y]$/,
    example: "131052-308T",
    sources: [
      "https://dvv.fi/en/personal-identity-code",
      "https://valtioneuvosto.fi/-/10623/henkilotunnusten-riittavyys-varmistetaan-uusilla-valimerkeilla",
      "https://en.wikipedia.org/wiki/National_identification_number#Finland",
    ],
    upstream: ["idnumbers", "nationid"],
    // Keep `-` and `+`: they are the century sign.
    normalize: (s) => compactKeeping(s, "-+"),
    parse(id, { referenceDate }) {
      const birth = birthFields(
        FI_CENTURY[id[6]!]! + Number(id.slice(4, 6)),
        Number(id.slice(2, 4)),
        Number(id.slice(0, 2)),
        referenceDate,
      );
      if (!birth) return { ok: false, reason: "invalid_date" };
      const individual = Number(id.slice(7, 10));
      if (individual < 2 || individual > 899) return { ok: false, reason: "invalid_range" };
      if (CHECK_CHARS[Number(id.slice(0, 6) + id.slice(7, 10)) % 31] !== id[10]) {
        return { ok: false, reason: "invalid_checksum" };
      }
      return {
        ok: true,
        data: { ...birth, gender: individual % 2 === 1 ? "male" : "female", serial: id.slice(7, 10), extra: { centurySign: id[6]! } },
      };
    },
  },
  {
    code: "FI_YTUNNUS",
    country: "FI",
    name: "Finnish Business ID",
    localName: "Y-tunnus",
    aliases: ["business identity code", "FO-nummer"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "01120389",
    sources: ["https://www.ytj.fi/en/index/businessid.html", "https://en.wikipedia.org/wiki/VAT_identification_number"],
    upstream: ["nationid"],
    format: (c) => `${c.slice(0, 7)}-${c[7]}`,
    parse: (id) => (ytunnusValid(id) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
  {
    code: "FI_VAT",
    country: "FI",
    name: "Finnish VAT Number",
    localName: "ALV-numero",
    aliases: ["VAT ID", "momsnummer"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^FI\d{8}$/,
    example: "FI01120389",
    sources: ["https://www.vero.fi/en/businesses-and-corporations/taxes-and-charges/vat/", "https://ec.europa.eu/taxation_customs/vies/"],
    upstream: ["nationid"],
    parse: (id) => (ytunnusValid(id.slice(2)) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
];
