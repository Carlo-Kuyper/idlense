import { describe, expect, test } from "vitest";
import { documents, rrnLegacyCheckDigit } from "../../src/countries/kr.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const withCheck = (first12: string) => first12 + rrnLegacyCheckDigit(first12);

describe("KR_RRN", () => {
  test("extracts birth date, gender, citizenship", () => {
    expect(validateDocument("KR_RRN", "800101-1234560")).toMatchObject({
      ok: true,
      normalized: "8001011234560",
      formatted: "800101-1234560",
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "male", citizenship: "citizen", extra: { legacyChecksumValid: true } },
    });
    expect(validateDocument("KR_RRN", "0502294000000")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(validateDocument("KR_RRN", "0402284987654")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2004-02-28", gender: "female", extra: { legacyChecksumValid: false } },
    });
  });

  test("century digits incl. 1800s", () => {
    expect(validateDocument("KR_RRN", "9912319000000")).toMatchObject({ ok: true, data: { dateOfBirth: "1899-12-31", gender: "male" } });
    expect(validateDocument("KR_RRN", "9912310000000")).toMatchObject({ ok: true, data: { dateOfBirth: "1899-12-31", gender: "female" } });
    expect(validateDocument("KR_RRN", "2001012000000")).toMatchObject({ ok: true, data: { dateOfBirth: "1920-01-01", gender: "female" } });
    expect(validateDocument("KR_RRN", "2001013000000")).toMatchObject({ ok: true, data: { dateOfBirth: "2020-01-01", gender: "male" } });
  });

  test("post-October-2020 numbers have no check digit", () => {
    // random tail: valid shape and date, check digit not enforced
    expect(validateDocument("KR_RRN", "2103154839201")).toMatchObject({ ok: true, data: { dateOfBirth: "2021-03-15" } });
  });

  test("rejections", () => {
    expect(validateDocument("KR_RRN", "2611173000000")).toMatchObject({ ok: false, reason: "invalid_date" }); // future
    expect(validateDocument("KR_RRN", "8001015000000")).toMatchObject({ ok: false, reason: "invalid_format" }); // foreigner digit
    expect(validateDocument("KR_RRN", "8013011000000")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(validateDocument("KR_RRN", "800101100000")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  /** Our fix: future birth dates rejected. idnumbers needs the dashed form. */
  const futureFix = (code: string) => (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = validateDocument(code, s);
    return !r.ok && r.reason === "invalid_date" && s.slice(0, 2) >= "26" ? "future birth date rejected" : undefined;
  };

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "KR_RRN"),
      generate: (r) => fromTemplate("##[01]#[0-3]#[0-49]######", r),
      samples: 10000,
      allow: futureFix("KR_RRN"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers for foreigners (KR_FRN)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "KR_FRN"),
      generate: (r) => fromTemplate("##[01]#[0-3]#[5-8]######", r),
      samples: 10000,
      allow: futureFix("KR_FRN"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers OldResidentRegistration (KR_RRN_LEGACY)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "KR_RRN_LEGACY"),
      generate: (r) => {
        const s = fromTemplate("##[01]#[0-3]#[0-49]#####", r);
        return r() < 0.5 ? withCheck(s) : s + fromTemplate("#", r);
      },
      samples: 10000,
      allow: futureFix("KR_RRN_LEGACY"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("KR_FRN", () => {
  test("foreigner numbers", () => {
    expect(validateDocument("KR_FRN", "800101-5123456")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", gender: "male", citizenship: "foreigner" },
    });
    expect(validateDocument("KR_FRN", "0512318123456")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2005-12-31", gender: "female", citizenship: "foreigner" },
    });
    expect(validateDocument("KR_FRN", "8001011234560")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("KR_RRN_LEGACY", () => {
  test("extracts region and serial", () => {
    expect(validateDocument("KR_RRN_LEGACY", "800101-1234560")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", region: "23", serial: "6", extra: { registrationOffice: "2345" } },
    });
    expect(validateDocument("KR_RRN_LEGACY", "8001011234561")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("KR_RRN_LEGACY", "8001015123456")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("KR_BRN", () => {
  test("valid numbers", () => {
    // Samsung Electronics, a published company number
    expect(validateDocument("KR_BRN", "124-81-00998")).toMatchObject({
      ok: true,
      formatted: "124-81-00998",
      data: { serial: "0099", extra: { typeCode: "81", corporation: true, taxOffice: "124" } },
    });
    expect(validateDocument("KR_BRN", "1018112341")).toMatchObject({ ok: true });
  });

  test("rejections", () => {
    expect(validateDocument("KR_BRN", "1248100997")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("KR_BRN", "124810099")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
