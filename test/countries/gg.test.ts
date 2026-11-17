import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/gg.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const SSN = spec(documents, "GG_SSN");
describeContract(documents);

describe("GG_SSN", () => {
  test("extracts the serial", () => {
    expect(check(SSN, "gy 123456", REF)).toMatchObject({
      ok: true,
      normalized: "GY123456",
      formatted: "GY 123456",
      data: { serial: "123456" },
    });
  });

  // Published sample shape: "GYXXXXXX" (Guernsey OECD TIN sheet; X = any digit).
  test("published sample shape", () => {
    expect(check(SSN, "GY000000", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(SSN, "JY123456", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(SSN, "GY12345A", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(SSN, "GY1234567", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    // Jersey/UK numbers kept by pre-1979 movers are validated by JE_SSN / GB_NINO, not here.
    expect(check(SSN, "JY123456A", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("GG_TRN", () => {
  const TRN = spec(documents, "GG_TRN");

  // Published sample shapes from Guernsey's OECD TIN sheet.
  test("non-Guernsey company: 1C 123456 / O", () => {
    expect(check(TRN, "1C 123456 / O", REF)).toMatchObject({
      ok: true,
      normalized: "1C123456O",
      formatted: "1C 123456 / O",
      data: { serial: "123456", extra: { kind: "company", prefix: "1C", suffix: "O" } },
    });
  });

  test("partnership: 1PP 123456 / F", () => {
    expect(check(TRN, "1pp 123456 / f", REF)).toMatchObject({
      ok: true,
      normalized: "1PP123456F",
      formatted: "1PP 123456 / F",
      data: { serial: "123456", extra: { kind: "partnership", prefix: "1PP", suffix: "F" } },
    });
  });

  test("the suffix is optional", () => {
    const r = check(TRN, "1C 123456", REF);
    expect(r).toMatchObject({ ok: true, formatted: "1C 123456", data: { extra: { kind: "company" } } });
    expect(r.ok && r.data.extra.suffix).toBeUndefined();
    expect(check(TRN, "2PP123456", REF)).toMatchObject({ ok: true, data: { extra: { kind: "partnership" } } });
  });

  test("rejections", () => {
    expect(check(TRN, "CC123456O", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TRN, "1PPP12345", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TRN, "1C12345O", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TRN, "1C123456OO", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TRN, "1C12345", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TRN, "GY123456", REF)).toMatchObject({ ok: false, reason: "invalid_format" }); // that's GG_SSN
  });
});
