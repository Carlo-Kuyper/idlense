import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/ae.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const AE = spec(documents, "AE_EID");
describeContract(documents);

const withCheck = (first14: string) => first14 + luhnCheckDigit(first14);

describe("AE_EID", () => {
  test("extracts birth year and serial", () => {
    expect(check(AE, "784-1980-1234567-8")).toMatchObject({
      ok: true,
      normalized: "784198012345678",
      formatted: "784-1980-1234567-8",
      data: { birthYear: 1980, serial: "1234567", extra: {} },
    });
  });

  test("birth year bounds", () => {
    expect(check(AE, withCheck("78420261234567"))).toMatchObject({ ok: true, data: { birthYear: 2026 } });
    expect(check(AE, withCheck("78420271234567"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(AE, withCheck("78420271234567"), new Date(2027, 0, 1)).ok).toBe(true);
    expect(check(AE, withCheck("78418991234567"))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("rejections", () => {
    expect(check(AE, "784198012345679")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(AE, withCheck("78519801234567"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(AE, "78419801234567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => {
    const body = fromTemplate("784[12][09]#########", r);
    return r() < 0.6 ? body + luhnCheckDigit(body) : fromTemplate("784[12][09]##########", r);
  };
  const yearFix = (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = check(AE, s);
    if (r.ok) return undefined;
    if (r.reason === "invalid_date") return "future birth year rejected";
    if (r.reason === "invalid_format" && !/^784(19|20)/.test(s)) return "birth year outside 1900-2099 rejected";
    return undefined;
  };

  test("agrees with idnumbers except birth-year checks", () => {
    const res = compareWithOracle({ spec: AE, generate: gen, allow: yearFix });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(Object.keys(res.explained).sort()).toEqual(["birth year outside 1900-2099 rejected", "future birth year rejected"]);
  });

  test("agrees with personal-identity-validation except births in the current year", () => {
    const res = compareWithOracle({
      spec: AE,
      generate: (r) => (r() < 0.2 ? withCheck("7842026" + fromTemplate("#######", r)) : gen(r)),
      allow: (s, ours) => (ours && Number(s.slice(3, 7)) === REF.getFullYear() ? "born in the reference year accepted" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(res.explained).toHaveProperty("born in the reference year accepted");
  });
});
