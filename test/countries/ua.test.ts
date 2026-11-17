import { describe, expect, test } from "vitest";
import { icaoCheckDigit, weightedSum } from "../../src/core/algorithms.js";
import { dateFromDayCount, documents, edrpouCheckDigit, rnokppCheckDigit } from "../../src/countries/ua.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("UA_RNOKPP", () => {
  const withCheck = (b: string) => b + rnokppCheckDigit(b + "0");

  test("day count epoch", () => {
    expect(dateFromDayCount(1)).toEqual({ y: 1900, m: 1, d: 1 });
    expect(dateFromDayCount(29220)).toEqual({ y: 1980, m: 1, d: 1 });
    expect(dateFromDayCount(36524)).toEqual({ y: 1999, m: 12, d: 31 });
  });

  test("extracts everything", () => {
    expect(v("UA_RNOKPP", "2922012341")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "female", serial: "1234" },
    });
    expect(v("UA_RNOKPP", withCheck("292201235"))).toMatchObject({ ok: true, data: { gender: "male" } });
  });

  test("rejections", () => {
    expect(v("UA_RNOKPP", "2922012342")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // day 49999 is in 2036
    expect(v("UA_RNOKPP", withCheck("499991234"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("UA_RNOKPP", "292201234")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("negative weighted sum uses a true modulo", () => {
    // Σ = -1·1 = -1 → (−1 mod 11) = 10 → 0
    expect(rnokppCheckDigit("1000000000")).toBe(0);
    expect(v("UA_RNOKPP", "1000000000")).toMatchObject({ ok: true, data: { dateOfBirth: "1927-05-19" } });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "UA_RNOKPP"),
      generate: (r) => fromTemplate("[0-4]#########", r),
      samples: 20000,
      allow: (s, ours) => {
        if (ours) return weightedSum(s, [-1, 5, 7, 9, 4, 6, 10, 5, 7]) < 0 ? "negative sum: true modulo" : undefined;
        const r = v("UA_RNOKPP", s);
        return !r.ok && r.reason === "invalid_date" ? "future birth date rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("UA_EDRPOU", () => {
  test("worked example and weight ranges", () => {
    expect(v("UA_EDRPOU", "32855961")).toMatchObject({ ok: true });
    expect(v("UA_EDRPOU", "32855962")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // 6xxxxxxx uses the plain weights 1..7 (idnumbers would expect 1 here)
    expect(v("UA_EDRPOU", "61234568")).toMatchObject({ ok: true });
  });

  test("shifted weights start at exactly 30 000 000", () => {
    // 30000000 itself uses 7,1,2,3,4,5,6 (21 mod 11 = 10, retry 27 mod 11 = 5), not 1..7 (3)
    expect(edrpouCheckDigit("30000000")).toBe(5);
    expect(v("UA_EDRPOU", "30000000")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("UA_EDRPOU", "30000005")).toMatchObject({ ok: true });
    // just below the boundary: plain weights
    expect(edrpouCheckDigit("29999990")).toBe(3);
    expect(v("UA_EDRPOU", "29999993")).toMatchObject({ ok: true });
  });

  const shiftedOurs = (s: string) => Number(s) >= 30_000_000 && Number(s) < 60_000_000;
  const shiftedTheirs = (s: string) => s[0]! >= "3" && s[0]! <= "6";

  test("agrees with idnumbers except the 30M-60M range fix", () => {
    const res = compareWithOracle({
      spec: spec(documents, "UA_EDRPOU"),
      generate: (r) => fromTemplate("########", r),
      samples: 20000,
      allow: (s) => (shiftedOurs(s) !== shiftedTheirs(s) ? "shifted weights only for 30 000 000 <= code < 60 000 000" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("UA_UNZR", () => {
  test("extracts the date and serial", () => {
    expect(v("UA_UNZR", "19800101-00121")).toMatchObject({
      ok: true,
      normalized: "1980010100121",
      formatted: "19800101-00121",
      data: { dateOfBirth: "1980-01-01", serial: "0012" },
    });
  });

  test("rejections", () => {
    expect(v("UA_UNZR", "1980010100122")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    const body = "198002300012";
    expect(v("UA_UNZR", body + icaoCheckDigit(body))).toMatchObject({ ok: false, reason: "invalid_date" });
    const zero = "198001010000";
    expect(v("UA_UNZR", zero + icaoCheckDigit(zero))).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});
