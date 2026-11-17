import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bb.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TIN = spec(documents, "BB_TIN");
describeContract(documents);

describe("BB_TIN", () => {
  // OECD sheet (BRA): 13 digits, always starting with 1.
  test("shape", () => {
    expect(check(TIN, "1000000000000", REF)).toMatchObject({ ok: true });
    expect(check(TIN, "1 234 567 890 123", REF)).toMatchObject({ ok: true });
  });

  test("rejections", () => {
    expect(check(TIN, "2234567890123", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "123456789012", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
