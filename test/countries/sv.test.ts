import { describe, expect, test } from "vitest";
import { documents, svDuiCheck, svNitCheck } from "../../src/countries/sv.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("SV_DUI", () => {
  test("check digit", () => {
    expect(v("SV_DUI", "12345678-4")).toMatchObject({ ok: true, formatted: "12345678-4", data: { serial: "12345678" } });
    expect(v("SV_DUI", "00000001-8")).toMatchObject({ ok: true });
    expect(v("SV_DUI", "12345678-9")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("SV_DUI", "00000000-0")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid except the all-zero placeholder", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SV_DUI"),
      generate: (r) => {
        const b = r() < 0.01 ? "00000000" : fromTemplate("########", r);
        return b + (r() < 0.5 ? svDuiCheck(b) : fromTemplate("#", r));
      },
      allow: (s, ours) => (!ours && s === "000000000" ? "all-zero placeholder rejected" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("SV_NIT", () => {
  test("both check-digit schemes, against published NITs", () => {
    // Ministry of Finance list of public bodies (correlativo ≤ 100)
    for (const n of ["0614-110121-001-3", "0614-180948-001-4", "0614-010182-001-1"]) expect(v("SV_NIT", n).ok, n).toBe(true);
    // python-stdnum documentation (correlativo > 100)
    expect(v("SV_NIT", "0614-050707-104-8")).toMatchObject({ ok: true, data: { extra: { date: "2007-07-05" } } });
    expect(v("SV_NIT", "0614-050707-104-0")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("extracts everything", () => {
    expect(v("SV_NIT", "0614-150590-101-5")).toMatchObject({
      ok: true,
      formatted: "0614-150590-101-5",
      data: { region: "0614", regionName: "San Salvador", serial: "101", extra: { date: "1990-05-15" } },
    });
    const foreign = "9450010190001" + svNitCheck("9450010190001");
    expect(v("SV_NIT", foreign)).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
  });

  test("rejections", () => {
    const b = "1514150590101";
    expect(v("SV_NIT", b + svNitCheck(b))).toMatchObject({ ok: false, reason: "invalid_range" });
    const d = "0614310290101";
    expect(v("SV_NIT", d + svNitCheck(d))).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  /** nationid's formula: weights 14..2, 11 − Σ mod 11 (0 → 0, 1 → 1). */
  const nationidCheck = (s: string) => {
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(s[i]) * (14 - i);
    const m = sum % 11;
    return m <= 1 ? m : 11 - m;
  };

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SV_NIT"),
      generate: (r) => {
        const b = fromTemplate("[01]#[0-3]#[0-3]#[01]####[01]#", r);
        const roll = r();
        return b + (roll < 0.4 ? svNitCheck(b) : roll < 0.8 ? nationidCheck(b) : fromTemplate("#", r));
      },
      samples: 5000,
      allow: (s, ours) => {
        const r = v("SV_NIT", s);
        if (!ours && !r.ok && r.reason === "invalid_date") return "impossible date rejected";
        if (!ours && !r.ok && r.reason === "invalid_range") return "unknown department rejected";
        if (!ours && !r.ok && r.reason === "invalid_format") return "impossible date rejected"; // day/month outside 01-31/01-12
        if (svNitCheck(s) !== nationidCheck(s)) return "check-digit scheme fixed (correlativo ≤ 100 / > 100)";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("SV_PASAPORTE", () => {
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SV_PASAPORTE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "[A-Z0-9]########" : "[A-Z0-9]#######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
