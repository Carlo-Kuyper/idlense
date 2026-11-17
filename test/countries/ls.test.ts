import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ls.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NIN = spec(documents, "LS_NIN");
const TIN = spec(documents, "LS_TIN");
describeContract(documents);

describe("LS_NIN", () => {
  // The NICR director's own illustrative number, slide 13 of
  // https://id4africa.com/2015/presentations/31_Tumelo_Raboletsi.pdf ("01- 12345678- 17").
  // The four NINs in LesLII judgments that informed the header aren't copied (real people).
  test("published illustration", () => {
    expect(check(NIN, "01- 12345678- 17", REF)).toMatchObject({
      ok: true,
      normalized: "011234567817",
      formatted: "01-12345678-17",
    });
  });

  test("shape only: no check digit enforced", () => {
    expect(check(NIN, "011234567810", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(NIN, "01123456781", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NIN, "0112345678170", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("LS_TIN", () => {
  // RSL's format example, as reported by https://lookuptax.com/validate/lesotho/tin
  test("current and legacy layouts", () => {
    expect(check(TIN, "123456789-0", REF)).toMatchObject({
      ok: true,
      normalized: "1234567890",
      formatted: "123456789-0",
      data: { serial: "123456789", extra: { legacy: false } },
    });
    expect(check(TIN, "1234567-8", REF)).toMatchObject({
      ok: true,
      formatted: "1234567-8",
      data: { extra: { legacy: true } },
    });
  });

  test("rejections", () => {
    expect(check(TIN, "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "12345678901", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
