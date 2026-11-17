import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/gd.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TIN = spec(documents, "GD_TIN");
describeContract(documents);

describe("GD_TIN", () => {
  // OECD sheet (Grenada IRD): a six-digit unique number.
  test("shape", () => {
    expect(check(TIN, "000123", REF)).toMatchObject({ ok: true });
    expect(check(TIN, "123 456", REF)).toMatchObject({ ok: true });
  });

  test("rejections", () => {
    expect(check(TIN, "1234567", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
