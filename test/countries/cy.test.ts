import { describe, expect, test } from "vitest";
import { cyCheckLetter, documents } from "../../src/countries/cy.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const VAT = spec(documents, "CY_VAT");
describeContract(documents);

describe("CY_VAT", () => {
  test("forms and rejections", () => {
    expect(check(VAT, "00123456H")).toMatchObject({ ok: true, normalized: "00123456H" });
    expect(check(VAT, "CY 10259033P")).toMatchObject({ ok: true, normalized: "10259033P" });
    expect(check(VAT, "cy10259033p")).toMatchObject({ ok: true });
    expect(check(VAT, "60000001T")).toMatchObject({ ok: true });
    expect(check(VAT, "10259033Q")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    const twelve = "12345678" + cyCheckLetter("12345678");
    expect(check(VAT, twelve)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(VAT, "102590331")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(VAT, "1025903P")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => {
    const b = fromTemplate(r() < 0.2 ? "12######" : "########", r);
    return r() < 0.5 ? b + cyCheckLetter(b) : b + fromTemplate("A", r);
  };

  test("agrees with nationid CY_VAT", () => {
    const res = compareWithOracle({ spec: VAT, generate: gen, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers CYP except the 12 prefix", () => {
    const res = compareWithOracle({
      spec: VAT,
      generate: gen,
      samples: 5000,
      allow: (s, ours) => (!ours && s.startsWith("12") ? "unissued 12 prefix rejected" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
