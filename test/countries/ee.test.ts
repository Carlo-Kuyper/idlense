import { describe, expect, test } from "vitest";
import { balticCheckDigit, documents } from "../../src/countries/ee.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const withCheck = (b: string) => b + balticCheckDigit(b);
describeContract(documents);

describe("EE_ISIKUKOOD", () => {
  test("extracts everything", () => {
    expect(v("EE_ISIKUKOOD", "38001010009")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "male", serial: "000" },
    });
    expect(v("EE_ISIKUKOOD", withCheck("6120229123"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2012-02-29", gender: "female", serial: "123" },
    });
    expect(v("EE_ISIKUKOOD", withCheck("2991231001"))).toMatchObject({ ok: true, data: { dateOfBirth: "1899-12-31" } });
  });

  test("check digit second pass", () => {
    // first pass gives 10 for this body
    const body = "3330924006";
    expect(balticCheckDigit(body)).toBe(4);
  });

  test("rejections", () => {
    expect(v("EE_ISIKUKOOD", "38001010008")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("EE_ISIKUKOOD", withCheck("7800101000"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("EE_ISIKUKOOD", withCheck("6110229123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("EE_ISIKUKOOD", withCheck("6271231123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("EE_ISIKUKOOD", "3800101000")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "EE_ISIKUKOOD"),
      generate: (r) => fromTemplate("[1-8]##[01]#[0-3]#####", r),
      samples: 20000,
      allow: (s, ours) => {
        if (ours) return undefined;
        if (/^[78]/.test(s)) return "century digits 7/8 are not defined";
        const r = v("EE_ISIKUKOOD", s);
        return !r.ok && r.reason === "invalid_date" ? "future birth date rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("EE_VAT", () => {
  test("valid and invalid", () => {
    expect(v("EE_VAT", "100931558")).toMatchObject({ ok: true, normalized: "EE100931558", formatted: "EE 100931558" });
    expect(v("EE_VAT", "EE 100 931 559")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("EE_VAT", "DE100931558")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "EE_VAT"),
      generate: (r) => fromTemplate("EE#########", r),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
