import { describe, expect, test } from "vitest";
import { verhoeffCheckDigit } from "../../src/core/algorithms.js";
import { documents, luhnMod36Valid } from "../../src/countries/in.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const isPalindrome = (s: string) => s === [...s].reverse().join("");
describeContract(documents);

describe("IN_AADHAAR", () => {
  test("valid numbers", () => {
    for (const s of ["234123412346", "999888777669", "2341 2341 2346", "2341-2341-2346"]) {
      expect(v("IN_AADHAAR", s).ok, s).toBe(true);
    }
    expect(v("IN_AADHAAR", "234123412346")).toMatchObject({ ok: true, formatted: "2341 2341 2346", data: { extra: {} } });
  });

  test("rejections", () => {
    expect(v("IN_AADHAAR", "234123412347")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("IN_AADHAAR", "123412341234")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IN_AADHAAR", "023412341234")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IN_AADHAAR", "23412341234")).toMatchObject({ ok: false, reason: "invalid_length" });
    // A Verhoeff-valid palindrome: UIDAI excludes these.
    let pal = "";
    for (let a = 200000; a < 999999 && !pal; a++) {
      const s = String(a) + [...String(a)].reverse().join("");
      if (v("IN_AADHAAR", s).ok === false && verhoeffCheckDigit(s.slice(0, -1)) === Number(s[11])) pal = s;
    }
    expect(pal).not.toBe("");
    expect(v("IN_AADHAAR", pal)).toMatchObject({ ok: false, reason: "invalid_range" });
  });

  const gen = (r: () => number) => {
    const body = fromTemplate("[2-9]##########", r);
    return r() < 0.5 ? body + verhoeffCheckDigit(body) : body + fromTemplate("#", r);
  };
  const allow = (s: string, ours: boolean) => (!ours && isPalindrome(s) ? "palindromes excluded (UIDAI)" : undefined);

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({ spec: spec(documents, "IN_AADHAAR"), generate: gen, allow, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "IN_AADHAAR"), generate: gen, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("IN_VID", () => {
  test("valid and invalid", () => {
    expect(v("IN_VID", "1234 5678 9012 3455")).toMatchObject({ ok: true, formatted: "1234 5678 9012 3455" });
    expect(v("IN_VID", "1234567890123456")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("IN_VID", "2234567890123455")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IN_VID"),
      generate: (r) => {
        const body = fromTemplate("[12]##############", r);
        return r() < 0.5 ? body + verhoeffCheckDigit(body) : body + fromTemplate("#", r);
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("IN_PAN", () => {
  test("extracts holder status", () => {
    expect(v("IN_PAN", "abcpe1234f")).toMatchObject({ ok: true, normalized: "ABCPE1234F", data: { serial: "1234", extra: { holderStatus: "individual" } } });
    expect(v("IN_PAN", "AAPFU0939F")).toMatchObject({ ok: true, data: { extra: { holderStatus: "firm" } } });
    expect(v("IN_PAN", "AAACH7409R")).toMatchObject({ ok: true, data: { extra: { holderStatus: "company" } } });
  });

  test("rejections", () => {
    expect(v("IN_PAN", "ABMXA3211G")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IN_PAN", "ACUPA0000R")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("IN_PAN", "ACUPA7085RR")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IN_PAN"),
      generate: (r) => fromTemplate("AA[A-Z][ABCFGHJLPTXK]A[0-1][0-9]##A", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("IN_GSTIN", () => {
  test("extracts state and PAN", () => {
    expect(v("IN_GSTIN", "27AAPFU0939F1ZV")).toMatchObject({
      ok: true,
      data: { region: "27", regionName: "Maharashtra", extra: { pan: "AAPFU0939F", entityNumber: "1", holderStatus: "firm" } },
    });
    for (const s of ["07AAACH7409R1Z3", "09AAACI1681G1ZN", "33AAACR5055K1ZE", "29AAACW2702R1ZW", "19AAJCS6789L1Z9"]) {
      expect(v("IN_GSTIN", s).ok, s).toBe(true);
    }
  });

  test("rejections", () => {
    expect(v("IN_GSTIN", "27AAPFU0939F1ZO")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("IN_GSTIN", "27AAPFU0939F1AA")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IN_GSTIN", "27AAPFU0939F0ZV")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IN_GSTIN", "27ABMXA3211G1Z7")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IN_GSTIN", "50AAPFU0939F1ZV")).toMatchObject({ ok: false, reason: "invalid_range" });
  });

  test("agrees with nationid", () => {
    const A36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const res = compareWithOracle({
      spec: spec(documents, "IN_GSTIN"),
      generate: (r) => {
        const body = fromTemplate("[0-3]#AAA[ABCFGHJLPTX]A####A[0-9A-C]Z", r);
        if (r() < 0.3) return body + fromTemplate("X", r);
        const ok = [...A36].find((c) => luhnMod36Valid(body + c));
        return body + (ok ?? "0");
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("IN_EPIC", () => {
  test("shape only", () => {
    expect(v("IN_EPIC", "abc1234567")).toMatchObject({ ok: true, data: { serial: "1234567", extra: { series: "ABC" } } });
    expect(v("IN_EPIC", "1234567890")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IN_EPIC"),
      generate: (r) => fromTemplate("[A-Z0-9]AA#######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
