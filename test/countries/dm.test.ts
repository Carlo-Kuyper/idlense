import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/dm.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TIN = spec(documents, "DM_TIN");
describeContract(documents);

describe("DM_TIN", () => {
  // OECD sheet (Dominica IRD): up to 6 digits plus 1 check digit, often quoted without it.
  test("shape", () => {
    expect(check(TIN, "123456", REF)).toMatchObject({ ok: true });
    expect(check(TIN, "1", REF)).toMatchObject({ ok: true });
  });

  test("rejections", () => {
    expect(check(TIN, "0123456", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "12345678", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
