import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/je.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const SSN = spec(documents, "JE_SSN");
const TIN = spec(documents, "JE_TIN");
describeContract(documents);

describe("JE_SSN", () => {
  // Published samples: JY000000A (Jersey OECD TIN sheet and gov.je CRS guidance),
  // JY 123456 A (Guernsey OECD TIN sheet).
  test("published samples", () => {
    expect(check(SSN, "JY000000A", REF)).toMatchObject({
      ok: true,
      formatted: "JY 000000 A",
      data: { serial: "000000", extra: { suffix: "A" } },
    });
    expect(check(SSN, "JY 123456 A", REF)).toMatchObject({ ok: true, normalized: "JY123456A", data: { serial: "123456" } });
  });

  test("any final letter, lower-case input", () => {
    expect(check(SSN, "jy123456z", REF)).toMatchObject({ ok: true, data: { extra: { suffix: "Z" } } });
  });

  test("rejections", () => {
    // A UK NINO is not a Jersey number.
    expect(check(SSN, "QQ123456A", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(SSN, "JY1234567", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(SSN, "JY123456", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("JE_TIN", () => {
  // Published sample: 100-100-1000 (Jersey OECD TIN sheet).
  test("published sample", () => {
    expect(check(TIN, "100-100-1000", REF)).toMatchObject({
      ok: true,
      normalized: "1001001000",
      formatted: "100-100-1000",
      data: { serial: "1001001000" },
    });
  });

  test("rejections", () => {
    expect(check(TIN, "100-100-100", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    // The older entity form (CC00000) is not covered.
    expect(check(TIN, "CC00000", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
