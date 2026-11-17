import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bw.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const BW = spec(documents, "BW_OMANG");
describeContract(documents);

// No source publishes a sample Omang number; all numbers here are synthetic.
describe("BW_OMANG", () => {
  test("gender from the 5th digit", () => {
    expect(check(BW, "123416789", REF)).toMatchObject({
      ok: true,
      data: { gender: "male", citizenship: "citizen" },
    });
    expect(check(BW, "1234 2 6789", REF)).toMatchObject({ ok: true, data: { gender: "female" } });
  });

  test("rejections", () => {
    expect(check(BW, "123436789", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(BW, "123406789", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(BW, "12341678", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(BW, "1234167890", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
