/**
 * North Macedonia — Единствен матичен број на граѓанинот (ЕМБГ / EMBG).
 *
 * Same 13-digit DDMMYYY RR BBB K structure, region table and check digit as
 * every former-Yugoslav JMBG; the engine lives in ./rs.ts. Macedonian
 * register codes are 41-49; foreigners resident in Macedonia get 04.
 *
 * Improves on upstream (see ./rs.ts for the shared fixes):
 * - idnumbers MKD rejects register codes 51-59 (all allocated to Slovenia).
 * - idnumbers marks anyone registered outside 41-49 as a mere "resident";
 *   pre-1991 movers kept their number, so we only flag codes 01-08 (foreigners).
 * - idnumbers accepts future birth dates.
 */
import type { DocumentSpec } from "../core/types.js";
import { JMBG_SOURCES, jmbgCommon, parseJmbg } from "./rs.js";

export const documents: DocumentSpec[] = [
  {
    ...jmbgCommon,
    code: "MK_EMBG",
    country: "MK",
    name: "North Macedonian Unique Master Citizen Number",
    localName: "Единствен матичен број на граѓанинот",
    aliases: ["EMBG", "ЕМБГ", "JMBG"],
    confidence: "high",
    example: "0101990450006",
    sources: [...JMBG_SOURCES],
    parse: (id, ctx) => parseJmbg(id, ctx),
  },
];
