import { describe, expect, test } from "vitest";
import { weightedSum } from "../../src/core/algorithms.js";
import { isRealDate } from "../../src/core/dates.js";
import { dateFrom1867, documents } from "../../src/countries/hu.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const F = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const R = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
/** Append the check digit for weights `w`; undefined when remainder 10 (never issued). */
const withCheck = (b: string, w: number[]) => {
  const k = weightedSum(b, w) % 11;
  return k === 10 ? undefined : b + k;
};

describe("HU_SZEMELYI_SZAM", () => {
  test("extracts everything (born before 1997)", () => {
    expect(v("HU_SZEMELYI_SZAM", "1-800101-0016")).toMatchObject({
      ok: true,
      formatted: "1-800101-0016",
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "male", citizenship: "citizen", serial: "001" },
    });
    expect(v("HU_SZEMELYI_SZAM", withCheck("6800101001", F)!)).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", gender: "female", citizenship: "foreigner" },
    });
    expect(v("HU_SZEMELYI_SZAM", withCheck("7800101001", F)!)).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1880-01-01", gender: "male", citizenship: "foreigner" },
    });
  });

  test("born from 1997: reversed weights, no citizenship", () => {
    const n = withCheck("3050515123", R)!; // 2005-05-15
    expect(v("HU_SZEMELYI_SZAM", n)).toMatchObject({ ok: true, data: { dateOfBirth: "2005-05-15", gender: "male" } });
    expect(v("HU_SZEMELYI_SZAM", n).ok && (v("HU_SZEMELYI_SZAM", n) as { data: object }).data).not.toHaveProperty("citizenship");
    expect(v("HU_SZEMELYI_SZAM", withCheck("2980101012", R)!)).toMatchObject({ ok: true, data: { dateOfBirth: "1998-01-01", gender: "female" } });
    // the same body with part I weights is wrong for a 1998 birth
    expect(v("HU_SZEMELYI_SZAM", "29801010127")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("3/4 before 1900 (part I weights)", () => {
    // 2099 is in the future, so only the 1899 reading is possible
    expect(v("HU_SZEMELYI_SZAM", withCheck("4990101001", F)!)).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1899-01-01", gender: "female", citizenship: "citizen" },
    });
  });

  test("rejections", () => {
    expect(v("HU_SZEMELYI_SZAM", "18001010017")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("HU_SZEMELYI_SZAM", "18002300016")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("HU_SZEMELYI_SZAM", withCheck("5980101001", F)!)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("HU_SZEMELYI_SZAM", "98001010016")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "HU_SZEMELYI_SZAM"),
      generate: (r) => {
        const b = fromTemplate("[1-8]##[01]#[0-3]####", r);
        const w = r() < 0.5 ? F : R;
        return r() < 0.7 ? (withCheck(b, w) ?? b + "0") : b + fromTemplate("#", r);
      },
      samples: 20000,
      allow: (s, ours) => {
        const m = Number(s[0]);
        const yy = Number(s.slice(1, 3));
        const r = v("HU_SZEMELYI_SZAM", s);
        if (!ours && !r.ok && r.reason === "invalid_date") return "future birth date rejected";
        if (!ours && !r.ok && r.reason === "invalid_range") return "5/6 not issued after 1996";
        if (ours && r.ok) {
          if (r.data.birthYear! >= 1997) return "part II (reversed) weights for births from 1997";
          if ((m === 3 || m === 4) && r.data.birthYear! < 1900) return "3/4 read as a Hungarian born before 1900";
          return undefined;
        }
        // upstream applied part I weights to a post-1996 birth
        if (m <= 2 && yy >= 97) return "part II (reversed) weights for births from 1997";
        // upstream read 3/4 as 20YY with part I weights; the 18YY reading is not a real date (e.g. 29 Feb 1800)
        if ((m === 3 || m === 4) && !isRealDate(1800 + yy, Number(s.slice(3, 5)), Number(s.slice(5, 7)))) {
          return "3/4 with part I weights is 18YY";
        }
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(res.explained).toBeDefined();
  });
});

describe("HU_ADOAZONOSITO", () => {
  test("day count from 1867-01-01", () => {
    expect(dateFrom1867(0)).toEqual([1867, 1, 1]);
    expect(dateFrom1867(41272)).toEqual([1980, 1, 1]);
    expect(dateFrom1867(12112)).toEqual([1900, 3, 1]); // 1900 is not a leap year
  });

  test("extracts the birth date", () => {
    expect(v("HU_ADOAZONOSITO", "8412721233")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, serial: "123" },
    });
    expect(v("HU_ADOAZONOSITO", "8412721234")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("HU_ADOAZONOSITO", withCheck("899999123", F.slice(0, 9))!)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("HU_ADOAZONOSITO", "7412721233")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("HU_TAJ", () => {
  test("check digit", () => {
    expect(v("HU_TAJ", "123 456 788")).toMatchObject({ ok: true, formatted: "123 456 788", data: { serial: "12345678" } });
    expect(v("HU_TAJ", "123456789")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
});

describe("HU_VAT", () => {
  test("check digit", () => {
    expect(v("HU_VAT", "HU 12345676")).toMatchObject({ ok: true, formatted: "HU 12345676" });
    expect(v("HU_VAT", "12345676")).toMatchObject({ ok: true });
    expect(v("HU_VAT", "HU12345677")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "HU_VAT"),
      generate: (r) => "HU" + fromTemplate("########", r),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
