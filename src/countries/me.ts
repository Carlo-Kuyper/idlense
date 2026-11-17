/**
 * Montenegro — Jedinstveni matični broj građana (JMBG).
 *
 * Same 13-digit DDMMYYY RR BBB K structure, region table and check digit as
 * every former-Yugoslav JMBG; the engine lives in ./rs.ts. Montenegrin
 * register codes are 21-29; foreigners resident in Montenegro get 02.
 *
 * Improves on upstream (see ./rs.ts for the shared fixes):
 * - idnumbers MNE rejects register codes 51-59 (all allocated to Slovenia).
 * - idnumbers marks anyone registered outside 21-29 as a mere "resident";
 *   pre-1991 movers kept their number, so we only flag codes 01-08 (foreigners).
 * - idnumbers accepts future birth dates.
 */
import type { DocumentSpec } from "../core/types.js";
import { JMBG_SOURCES, jmbgCommon, parseJmbg } from "./rs.js";

export const documents: DocumentSpec[] = [
  {
    ...jmbgCommon,
    code: "ME_JMBG",
    country: "ME",
    name: "Montenegrin Unique Master Citizen Number",
    localName: "Jedinstveni matični broj građana",
    aliases: ["JMBG", "ЈМБГ"],
    confidence: "high",
    example: "0101990260002",
    sources: [...JMBG_SOURCES],
    parse: (id, ctx) => parseJmbg(id, ctx),
  },
];
