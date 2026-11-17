import { describe, expect, test } from "vitest";
import { beCheck, documents } from "../../src/countries/be.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);
const nn = (first9: string, c: 1900 | 2000) => first9 + beCheck(first9, c);

describe("BE_NRN", () => {
  test("extracts", () => {
    expect(v("BE_NRN", "85.07.30-033.28")).toMatchObject({
      ok: true,
      formatted: "85.07.30-033.28",
      data: { dateOfBirth: "1985-07-30", birthYear: 1985, gender: "male", serial: "033" },
    });
    expect(v("BE_NRN", nn("400101002", 1900))).toMatchObject({ ok: true, data: { dateOfBirth: "1940-01-01", gender: "female" } });
    expect(v("BE_NRN", nn("100101002", 2000))).toMatchObject({ ok: true, data: { dateOfBirth: "2010-01-01" } });
    expect(v("BE_NRN", nn("850000123", 1900))).toMatchObject({ ok: true, data: { birthYear: 1985 } });
    expect((v("BE_NRN", nn("850000123", 1900)) as { data: object }).data).not.toHaveProperty("dateOfBirth");
  });
  test("rejections", () => {
    expect(v("BE_NRN", "85073003329")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("BE_NRN", nn("850230033", 1900))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("BE_NRN", nn("261231033", 2000))).toMatchObject({ ok: false, reason: "invalid_date" }); // future
    expect(v("BE_NRN", nn("850730000", 1900))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("BE_NRN", nn("850730998", 1900))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("BE_NRN", nn("851330033", 1900))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  const gen = (r: () => number) => {
    const b = fromTemplate("##[01]#[0-3]####", r);
    const x = r();
    return x < 0.4 ? nn(b, 1900) : x < 0.8 ? nn(b, 2000) : b + fromTemplate("##", r);
  };
  const reason = (s: string) => {
    const x = v("BE_NRN", s);
    return x.ok ? undefined : x.reason;
  };
  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BE_NRN"),
      generate: gen,
      samples: 20000,
      allow: (s, ours) => {
        const yy = Number(s.slice(0, 2));
        // idnumbers decides the century from YY < 50 rather than the check digits.
        if (ours && (s.slice(2, 4) === "00" || s.slice(4, 6) === "00")) return "unknown month/day accepted";
        if (ours && yy < 50 && v("BE_NRN", s).ok && (v("BE_NRN", s) as { data: { birthYear: number } }).data.birthYear < 1950) return "1900-1949 century from check digits";
        if (!ours && (reason(s) === "invalid_range" || reason(s) === "invalid_date")) return "counter/future date rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BE_NRN"),
      generate: gen,
      samples: 20000,
      allow: (s, ours) => (!ours && (reason(s) === "invalid_range" || reason(s) === "invalid_date") ? "counter/impossible or future date rejected" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BE_BIS", () => {
  test("extracts", () => {
    expect(v("BE_BIS", "85473003317")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1985-07-30", gender: "male", citizenship: "foreigner", extra: { sexKnown: true } },
    });
    const unknownSex = v("BE_BIS", nn("852730033", 1900));
    expect(unknownSex).toMatchObject({ ok: true, data: { dateOfBirth: "1985-07-30", extra: { sexKnown: false } } });
    expect((unknownSex as { data: object }).data).not.toHaveProperty("gender");
    expect(v("BE_NRN", "85473003317")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
  test("agrees with nationid on BIS numbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BE_BIS"),
      generate: (r) => {
        const b = fromTemplate("##[2-5]#[0-3]####", r);
        return r() < 0.5 ? nn(b, 1900) : nn(b, 2000);
      },
      samples: 20000,
      allow: (s, ours) => {
        const x = v("BE_BIS", s);
        if (!ours && !x.ok && (x.reason === "invalid_range" || x.reason === "invalid_date")) return "counter/impossible or future date rejected";
        if (!ours && !x.ok && x.reason === "invalid_format" && /^(3[3-9]|5[3-9])$/.test(s.slice(2, 4))) return "month 33-39/53-59 rejected";
        if (ours && /^[24]0$/.test(s.slice(2, 4))) return "BIS number with unknown month (20/40) accepted";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BE_BTW", () => {
  test("forms", () => {
    expect(v("BE_BTW", "BE 0403.170.701")).toMatchObject({ ok: true, normalized: "BE0403170701", formatted: "BE 0403.170.701" });
    expect(v("BE_BTW", "403170701")).toMatchObject({ ok: true, normalized: "BE0403170701" });
    expect(v("BE_BTW", "0776091951")).toMatchObject({ ok: true, normalized: "BE0776091951" });
    expect(v("BE_BTW", "BE0403170702")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("BE_BTW", "BE2403170701")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BE_BTW"),
      generate: (r) => {
        const b = fromTemplate("BE[01]#######", r);
        return b + (r() < 0.7 ? String(97 - (Number(b.slice(2)) % 97)).padStart(2, "0") : fromTemplate("##", r));
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
