import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/cz.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const mod11 = (s: string) => [...s].reduce((r, c) => (r * 10 + Number(c)) % 11, 0);
/** Append the digit that makes the 10-digit number divisible by 11 (if any). */
const withCheck = (b: string) => {
  for (let d = 0; d < 10; d++) if (mod11(b + d) === 0) return b + d;
  return b + "0";
};

describe("CZ_RC", () => {
  test("extracts everything", () => {
    expect(v("CZ_RC", "710319/2745")).toMatchObject({
      ok: true,
      formatted: "710319/2745",
      data: { dateOfBirth: "1971-03-19", birthYear: 1971, gender: "male", serial: "2745", extra: {} },
    });
  });

  test("women +50, overflow +20/+70, century", () => {
    expect(v("CZ_RC", withCheck("856012345"))).toMatchObject({ ok: true, data: { dateOfBirth: "1985-10-12", gender: "female" } });
    expect(v("CZ_RC", withCheck("057212345"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2005-02-12", gender: "female", extra: { overflowSeries: true } },
    });
    expect(v("CZ_RC", withCheck("052212345"))).toMatchObject({ ok: true, data: { dateOfBirth: "2005-02-12", gender: "male" } });
    // 10-digit YY 00-53 is 20YY: 2053 is in the future.
    expect(v("CZ_RC", withCheck("530101123"))).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("9-digit pre-1954 numbers", () => {
    expect(v("CZ_RC", "450515/123")).toMatchObject({
      ok: true,
      formatted: "450515/123",
      data: { dateOfBirth: "1945-05-15", gender: "male", serial: "123" },
    });
    expect(v("CZ_RC", "455515123")).toMatchObject({ ok: true, data: { gender: "female" } });
    expect(v("CZ_RC", "450515000")).toMatchObject({ ok: false, reason: "invalid_range" });
    // the +20 overflow set is always 10 digits
    expect(v("CZ_RC", "452515123")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("remainder-10 exception only until 1985", () => {
    // first nine digits ≡ 10 (mod 11), check digit 0
    const find = (prefix: string) => {
      for (let i = 0; i < 1000; i++) {
        const b = prefix + String(i).padStart(3, "0");
        if (mod11(b) === 10) return b + "0";
      }
      throw new Error("none");
    };
    const old = find("800101");
    expect(v("CZ_RC", old)).toMatchObject({ ok: true, data: { extra: { checkDigitException: true } } });
    expect(v("CZ_RC", find("900101"))).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("rejections", () => {
    expect(v("CZ_RC", "7103192746")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("CZ_RC", withCheck("710230123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("CZ_RC", "7113192745")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("CZ_RC", "71031927")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("CZ_RC", withCheck("261231123"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 2026-12-31 future
  });

  const gen = (r: () => number) => {
    const b = fromTemplate("[0-9]#[0-8]#[0-3]####", r);
    return r() < 0.6 ? withCheck(b) : b + fromTemplate("#", r);
  };

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CZ_RC"),
      generate: gen,
      samples: 20000,
      allow: (s, ours) => {
        const r = v("CZ_RC", s);
        if (ours && r.ok && r.data.extra.checkDigitException) return "pre-1985 remainder-10 numbers accepted";
        if (!ours && !r.ok && r.reason === "invalid_date") return "10-digit YY 00-53 is 20YY; future dates rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("idnumbers rejects every 9-digit number (fix)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CZ_RC"),
      generate: (r) => fromTemplate("[0-4]#[05][1-9][0-2]#[1-9]##", r),
      allow: (s, ours) => (ours && s.length === 9 ? "9-digit pre-1954 numbers accepted" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("CZ_ECP", () => {
  test("insurance number for foreigners", () => {
    expect(v("CZ_ECP", "710359/6005")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1971-03-19", gender: "male", citizenship: "foreigner", serial: "6005" },
    });
    expect(v("CZ_ECP", withCheck("710359500"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("CZ_ECP", "7103192745")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("CZ_RC", "7103596005")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("CZ_DIC", () => {
  test("legal entity and individual", () => {
    expect(v("CZ_DIC", "CZ12345679")).toMatchObject({ ok: true, formatted: "CZ 12345679", data: { extra: { kind: "legal_entity" } } });
    expect(v("CZ_DIC", "12345679")).toMatchObject({ ok: true });
    expect(v("CZ_DIC", "CZ 710319/2745")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1971-03-19", extra: { kind: "individual" } },
    });
    expect(v("CZ_DIC", "CZ12345678")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("CZ_DIC", "CZ92345679")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("CZ_DIC", "CZ7103192746")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("agrees with nationid CZ_DIC on the 8-digit branch", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CZ_DIC"),
      generate: (r) => fromTemplate("CZ########", r),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid lacks the individuals' (RČ) branch", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CZ_DIC"),
      generate: (r) => "CZ" + withCheck(fromTemplate("[5-9]#[05][1-9][0-2]####", r)),
      allow: (s, ours) => (ours && s.length === 12 ? "individuals' RČ-based DIČ accepted" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
