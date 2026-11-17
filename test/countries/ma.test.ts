import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ma.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const CIN = spec(documents, "MA_CIN");
const ICE = spec(documents, "MA_ICE");
describeContract(documents);

describe("MA_CIN", () => {
  test("extracts prefix and serial", () => {
    expect(check(CIN, "ab123456", REF)).toMatchObject({ ok: true, normalized: "AB123456", data: { region: "AB", serial: "123456" } });
    expect(check(CIN, "A12345", REF)).toMatchObject({ ok: true, data: { region: "A", serial: "12345" } });
  });

  test("rejections", () => {
    expect(check(CIN, "ABC12345", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(CIN, "1234567", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(CIN, "A1234567", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(CIN, "AB1234567", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("MA_ICE", () => {
  test("extracts enterprise and establishment", () => {
    expect(check(ICE, "001561191 0000 66", REF)).toMatchObject({
      ok: true,
      normalized: "001561191000066",
      formatted: "001561191 0000 66",
      data: { serial: "001561191", extra: { establishment: "0000" } },
    });
  });

  // Published samples: 001561191000066 and 002136093000040 (python-stdnum docs);
  // 001524400000046 (Ciments du Maroc, company statutes of 26 Oct 2021).
  test("published samples", () => {
    expect(check(ICE, "001561191000066", REF).ok).toBe(true);
    expect(check(ICE, "002136093000040", REF).ok).toBe(true);
    expect(check(ICE, "001524400000046", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(ICE, "001561191000065", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(ICE, "00156119100006", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
