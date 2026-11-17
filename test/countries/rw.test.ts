import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/rw.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const RW = spec(documents, "RW_NID");
describeContract(documents);

// No source publishes a sample number; all numbers here are synthetic.
describe("RW_NID", () => {
  test("extracts birth year, gender and parts", () => {
    expect(check(RW, "1 1990 8 0000001 0 12", REF)).toMatchObject({
      ok: true,
      formatted: "1 1990 8 0000001 0 12",
      data: {
        birthYear: 1990,
        gender: "male",
        serial: "0000001",
        extra: { statusDigit: "1", issueCount: 0, securityCode: "12" },
      },
    });
    expect(check(RW, "1200570000001134", REF)).toMatchObject({ ok: true, data: { birthYear: 2005, gender: "female", extra: { issueCount: 1 } } });
  });

  test("rejections", () => {
    expect(check(RW, "1202780000001012", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(RW, "1199060000001012", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(RW, "1189080000001012", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(RW, "119908000000101", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
