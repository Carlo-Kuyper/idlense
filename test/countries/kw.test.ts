import { describe, expect, test } from "vitest";
import { civilIdCheckDigit, documents } from "../../src/countries/kw.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const KW = spec(documents, "KW_CIVIL_ID");
describeContract(documents);

const withCheck = (b: string) => b + (civilIdCheckDigit(b) ?? "X");
/** A valid number for C+YYMMDD: the first serial whose check value isn't 10. */
const dated = (cyymmdd: string) => {
  for (let n = 0; ; n++) {
    const b = cyymmdd + String(n).padStart(4, "0");
    if (civilIdCheckDigit(b) !== undefined) return withCheck(b);
  }
};

describe("KW_CIVIL_ID", () => {
  test("extracts the birth date", () => {
    expect(check(KW, "280010100012")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, serial: "0001", extra: {} },
    });
    expect(check(KW, "305011501238")).toMatchObject({ ok: true, data: { dateOfBirth: "2005-01-15", serial: "0123" } });
  });

  test("dates", () => {
    expect(check(KW, dated("2900229"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 1900 not leap
    expect(check(KW, dated("3000229"))).toMatchObject({ ok: true, data: { dateOfBirth: "2000-02-29" } });
    expect(check(KW, dated("3261116"))).toMatchObject({ ok: true, data: { dateOfBirth: "2026-11-16" } });
    expect(check(KW, dated("3261117"))).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("rejections", () => {
    expect(check(KW, "280010100013")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // check value 10 is never issued
    expect(civilIdCheckDigit("28001010002")).toBeUndefined();
    for (let c = 0; c <= 9; c++) expect(check(KW, "28001010002" + c).ok).toBe(false);
    expect(check(KW, "180010100012")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(KW, "281310100012")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(KW, "28001010001")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except future birth dates", () => {
    const res = compareWithOracle({
      spec: KW,
      generate: (r) => {
        const body = fromTemplate("[23]#[0-9][01]#[0-3]#####", r);
        return r() < 0.6 ? withCheck(body) : fromTemplate("[1-4]###########", r);
      },
      samples: 5000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = check(KW, s);
        return !r.ok && r.reason === "invalid_date" ? "future birth date rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(res.explained).toHaveProperty("future birth date rejected");
  });
});
