import { describe, expect, test } from "vitest";
import { luhnCheckDigit, weightedSum } from "../../src/core/algorithms.js";
import { documents, uidCheckDigit } from "../../src/countries/at.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

/** Builds an SVNR from serial + date, or undefined when the remainder is 10. */
const svnr = (serial: string, date: string) => {
  const c = weightedSum(serial + "0" + date, [3, 7, 9, 0, 5, 8, 4, 2, 1, 6]) % 11;
  return c === 10 ? undefined : serial + c + date;
};

describe("AT_SVNR", () => {
  test("extracts the birth date", () => {
    expect(v("AT_SVNR", "1237 010180")).toMatchObject({
      ok: true,
      formatted: "1237 010180",
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, serial: "123", extra: {} },
    });
    expect(v("AT_SVNR", svnr("456", "150320")!)).toMatchObject({ ok: true, data: { dateOfBirth: "2020-03-15" } });
    expect(v("AT_SVNR", svnr("456", "171126")!)).toMatchObject({ ok: true, data: { dateOfBirth: "1926-11-17" } });
  });

  test("substitute dates are accepted without a birth date", () => {
    const r = v("AT_SVNR", svnr("100", "321380")!);
    expect(r).toMatchObject({ ok: true, data: { extra: { substituteDate: true } } });
    expect(r.ok && r.data.dateOfBirth).toBeUndefined();
  });

  test("rejections", () => {
    expect(v("AT_SVNR", "1238010180")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("AT_SVNR", "0237010180")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("AT_SVNR", "123701018")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("everything we accept, idnumbers accepts too", () => {
    // idnumbers accepts any 10 digits (bar one hard-coded case) as a "tax number".
    const res = compareWithOracle({
      spec: spec(documents, "AT_SVNR"),
      generate: (r) => {
        const s = fromTemplate("[1-9]##", r);
        const d = fromTemplate("[0-2]#[01]###", r);
        return (r() < 0.7 && svnr(s, d)) || fromTemplate("[1-9]#########", r);
      },
      allow: (s, ours, theirs) => (!ours && theirs && !s.startsWith("1237010") ? "idnumbers has no SVNR check digit" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("AT_STEUERNUMMER", () => {
  test("valid", () => {
    expect(v("AT_STEUERNUMMER", "12-345/6782")).toMatchObject({
      ok: true,
      formatted: "12-345/6782",
      data: { region: "12", serial: "345678" },
    });
    expect(v("AT_STEUERNUMMER", "12-345/6781")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "AT_STEUERNUMMER"),
      generate: (r) => {
        const b = fromTemplate("########", r);
        return b + (r() < 0.6 ? luhnCheckDigit(b) : fromTemplate("#", r));
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("AT_UID", () => {
  test("valid", () => {
    expect(v("AT_UID", "ATU 1234 5675")).toMatchObject({ ok: true, formatted: "ATU 1234 5675" });
    expect(v("AT_UID", "U12345675")).toMatchObject({ ok: true, normalized: "ATU12345675" });
    expect(v("AT_UID", "ATU12345676")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // BMF construction-rules example: check digit 6.
    expect(v("AT_UID", "U10223006")).toMatchObject({ ok: true, normalized: "ATU10223006" });
    expect(uidCheckDigit("1022300")).toBe(6);
  });

  const gen = (r: () => number) => {
    const b = fromTemplate("#######", r);
    return "ATU" + b + (r() < 0.6 ? uidCheckDigit(b) : fromTemplate("#", r));
  };

  test("agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "AT_UID"), generate: gen });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "AT_UID"),
      generate: gen,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
