/**
 * Bosnia and Herzegovina — Jedinstveni matični broj građana (JMBG).
 *
 * Same 13-digit DDMMYYY RR BBB K structure, region table and check digit as
 * every former-Yugoslav JMBG; the engine lives in ./rs.ts. BiH register codes
 * are 10-19; foreigners resident in BiH get 01.
 *
 * Improves on upstream (see ./rs.ts for the shared fixes):
 * - idnumbers BIH rejects register codes 51-59, which are all allocated to
 *   Slovenia (only 50 was used before 2024).
 * - idnumbers marks anyone registered outside 10-19 as a mere "resident";
 *   pre-1991 movers kept their number, so we only flag codes 01-08 (foreigners).
 * - idnumbers accepts future birth dates.
 */
import type { DocumentSpec } from "../core/types.js";
import { JMBG_SOURCES, jmbgCommon, parseJmbg } from "./rs.js";

export const documents: DocumentSpec[] = [
  {
    ...jmbgCommon,
    code: "BA_JMBG",
    country: "BA",
    name: "Bosnia and Herzegovina Unique Master Citizen Number",
    localName: "Jedinstveni matični broj građana",
    aliases: ["JMBG", "ЈМБГ"],
    confidence: "high",
    example: "0101990170003",
    sources: [...JMBG_SOURCES],
    parse: (id, ctx) => parseJmbg(id, ctx),
  },
];
