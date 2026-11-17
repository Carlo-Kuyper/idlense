import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/lr.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TIN = spec(documents, "LR_TIN");
describeContract(documents);

describe("LR_TIN", () => {
  // ArcelorMittal Liberia Ltd, as printed in LEITI's reports, via https://lookuptax.com/validate/liberia/tin
  test("published sample", () => {
    expect(check(TIN, "500036301", REF)).toMatchObject({ ok: true, data: { serial: "00036301" } });
  });

  test("rejections", () => {
    expect(check(TIN, "400036301", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "50003630", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "5000363011", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("LR_TIN metadata", () => {
  test("cites the LRA's own page", () => {
    expect(TIN.sources).toContain("https://revenue.lra.gov.lr/?p=9216");
    expect(TIN.confidence).toBe("moderate");
  });
});
