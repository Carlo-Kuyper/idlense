import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bz.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TIN = spec(documents, "BZ_TIN");
describeContract(documents);

describe("BZ_TIN", () => {
  // OECD sheet (Belize Tax Service): 6-digit TIN + a check digit the taxpayer doesn't see.
  test("with and without the hidden check digit", () => {
    expect(check(TIN, "1234567", REF)).toMatchObject({ ok: true, data: { serial: "123456", extra: { hasCheckDigit: true } } });
    expect(check(TIN, "123456", REF)).toMatchObject({ ok: true, data: { serial: "123456", extra: { hasCheckDigit: false } } });
  });

  test("rejections", () => {
    expect(check(TIN, "12345", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "12345678", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
