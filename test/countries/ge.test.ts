import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ge.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("Georgia", () => {
  test("personal number is 11 digits", () => {
    expect(v("GE_PN", "01001012345")).toMatchObject({ ok: true, data: { extra: {} } });
    expect(v("GE_PN", "010010123")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("identification code legal form", () => {
    expect(v("GE_TIN", "204123456")).toMatchObject({ ok: true, data: { extra: { legalFormCode: "2", legalForm: "legal_entity" } } });
    expect(v("GE_TIN", "304123456")).toMatchObject({ ok: true, data: { extra: { legalForm: "individual" } } });
    expect(v("GE_TIN", "504123456")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("GE_TIN agrees with idnumbers' 9-digit number except the legal-form digit", () => {
    const res = compareWithOracle({
      spec: spec(documents, "GE_TIN"),
      generate: (r) => fromTemplate("#########", r),
      allow: (s, ours) => (!ours && !/^[1-4]/.test(s) ? "legal-form code must be 1-4" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
