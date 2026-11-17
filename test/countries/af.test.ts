import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/af.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const TAZKIRA = spec(documents, "AF_TAZKIRA");
const TIN = spec(documents, "AF_TIN");

describe("AF_TAZKIRA", () => {
  test("issue year and month (Solar Hijri)", () => {
    expect(check(TAZKIRA, "1400-0101-12345")).toMatchObject({
      ok: true,
      normalized: "1400010112345",
      formatted: "1400-0101-12345",
      data: { serial: "0112345", extra: { issueYearSolarHijri: 1400, issueMonth: 1 } },
    });
    expect(check(TAZKIRA, "1397 1200 00001")).toMatchObject({ ok: true, data: { extra: { issueYearSolarHijri: 1397, issueMonth: 12 } } });
  });

  test("rejections", () => {
    expect(check(TAZKIRA, "1396-0101-12345")).toMatchObject({ ok: false, reason: "invalid_range" }); // before e-Tazkira
    expect(check(TAZKIRA, "1499-0101-12345")).toMatchObject({ ok: false, reason: "invalid_range" }); // future year
    expect(check(TAZKIRA, "1400-1301-12345")).toMatchObject({ ok: false, reason: "invalid_format" }); // month 13
    expect(check(TAZKIRA, "2400-0101-12345")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TAZKIRA, "1400-0101-1234")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("AF_TIN", () => {
  test("10 digits", () => {
    expect(check(TIN, "1234567890")).toMatchObject({ ok: true, normalized: "1234567890" });
  });

  test("rejections", () => {
    expect(check(TIN, "123456789")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "12345678901")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
