/**
 * Slovenia — EMŠO (personal number) and davčna številka (tax number / VAT ID).
 *
 * EMŠO: the former-Yugoslav JMBG (engine in ./rs.ts), 13 digits
 * DD MM YYY RR BBB K. Slovenia's register codes are 50-59 (only 50 was used
 * until the 2024 Central Population Register amendment); citizens registered
 * elsewhere in Yugoslavia before 1991 kept their number. Per the government
 * decree on EMŠO (Uradni list RS 8/1999, art. 4) a remainder of 1 has no
 * valid check digit and the serial is skipped, so such numbers are rejected.
 *
 * Davčna številka: 8 digits, first seven random (first digit 1-9), the eighth
 * a mod-11 check digit with weights 8,7,6,5,4,3,2: K = 11 − (sum mod 11),
 * 10 → 0, 11 never issued. Issued to individuals and legal entities; the
 * VAT ID is the same number with the `SI` prefix (stripped here).
 *
 * Improves on upstream:
 * - idnumbers SVN only accepts register code 50-59, rejecting Slovenian
 *   citizens with a pre-1991 number from another republic, and it accepts
 *   remainder-1 numbers (written with K = 0) that the decree says are never
 *   issued, and future birth dates.
 * - nationid SI_VAT has the check digit wrong for 3 of 11 remainders: it
 *   rejects remainder 1 (K = 0, e.g. SI 48673820) and wants K = 0 for remainder
 *   10 (K = 1, e.g. SI 83815201) and K = 1 for remainder 0 (never issued).
 *   Real VAT numbers in the EU VIES test set confirm our mapping.
 *
 * Ported from idnumbers and nationid (MIT).
 */
import { weightedSum } from "../core/algorithms.js";
import { compact } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";
import { JMBG_SOURCES, jmbgCommon, parseJmbg } from "./rs.js";

const VAT_W = [8, 7, 6, 5, 4, 3, 2];

export function siTaxCheckDigit(body7: string): number | undefined {
  const c = 11 - (weightedSum(body7, VAT_W) % 11);
  if (c === 11) return undefined;
  return c === 10 ? 0 : c;
}

export const documents: DocumentSpec[] = [
  {
    ...jmbgCommon,
    code: "SI_EMSO",
    country: "SI",
    name: "Slovenian Unique Master Citizen Number",
    localName: "Enotna matična številka občana",
    aliases: ["EMŠO", "EMSO", "JMBG"],
    confidence: "high",
    example: "0101990500003",
    sources: [
      "https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/1999-01-0345",
      "https://www.gov.si/teme/registri-in-evidence-prebivalstva/",
      ...JMBG_SOURCES,
    ],
    parse: (id, ctx) => parseJmbg(id, ctx, true),
  },
  {
    code: "SI_VAT",
    country: "SI",
    name: "Slovenian Tax Number",
    localName: "Davčna številka",
    aliases: ["ID za DDV", "VAT number", "tax number", "DŠ"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [8],
    pattern: /^[1-9]\d{7}$/,
    example: "12345679",
    sources: [
      "https://www.fu.gov.si/davki_in_druge_dajatve/poslovanje_z_nami/vpis_v_davcni_register_in_davcna_stevilka/",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize: (s) => compact(s).replace(/^SI/, ""),
    parse(id) {
      if (siTaxCheckDigit(id.slice(0, 7)) !== Number(id[7])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
