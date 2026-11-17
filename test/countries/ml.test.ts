import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ml.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NINA = spec(documents, "ML_NINA");
describeContract(documents);

describe("ML_NINA", () => {
  test("returns the decree's segments raw", () => {
    expect(check(NINA, "1 1 90 1234567 001 k", REF)).toMatchObject({
      ok: true,
      normalized: "11901234567001K",
      formatted: "1 1 90 1234567 001 K",
      data: { region: "1234567", serial: "001", extra: { firstCode: "1", secondCode: "1", yearDigits: "90", keyLetter: "K" } },
    });
  });

  test("rejections", () => {
    expect(check(NINA, "119012345670011", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NINA, "A1901234567001K", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NINA, "1190123456700K", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
