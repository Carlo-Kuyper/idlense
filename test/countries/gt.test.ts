import { describe, expect, test } from "vitest";
import { documents, GT_DEPARTMENTS, gtNitCheck } from "../../src/countries/gt.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

/** Builds a DPI with a correct check digit (or undefined when the remainder is 10). */
function dpi(correlative: string, place: string): string | undefined {
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(correlative[i]) * (i + 2);
  const r = sum % 11;
  return r === 10 ? undefined : correlative + r + place;
}

describe("GT_DPI", () => {
  test("extracts everything", () => {
    expect(v("GT_DPI", "1912 34567 0101")).toMatchObject({
      ok: true,
      formatted: "1912 34567 0101",
      data: { region: "0101", regionName: "Guatemala", serial: "19123456", extra: { municipality: "01" } },
    });
    // Petatán (13-33) and Sipacate (05-14), created in 2015
    expect(v("GT_DPI", "1234567891333")).toMatchObject({ ok: true, data: { regionName: "Huehuetenango" } });
    expect(v("GT_DPI", "2547663230514")).toMatchObject({ ok: true, data: { regionName: "Escuintla" } });
  });

  test("rejections", () => {
    expect(v("GT_DPI", "1912345680101")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("GT_DPI", dpi("19123456", "0118")!)).toMatchObject({ ok: false, reason: "invalid_range" }); // Guatemala has 17
    expect(v("GT_DPI", dpi("19123456", "2301")!)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("GT_DPI", "191234567010")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("municipality table totals 340", () => {
    expect(GT_DEPARTMENTS.reduce((a, [, n]) => a + n, 0)).toBe(340);
  });

  const gen = (r: () => number) => {
    const s = fromTemplate("########", r);
    const place = fromTemplate("[0-2]#[0-3]#", r);
    return (r() < 0.8 ? dpi(s, place) : undefined) ?? s + fromTemplate("#", r) + place;
  };

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({ spec: spec(documents, "GT_DPI"), generate: gen, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid except the municipality table", () => {
    const res = compareWithOracle({
      spec: spec(documents, "GT_DPI"),
      generate: gen,
      samples: 5000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = v("GT_DPI", s);
        if (!r.ok && r.reason === "invalid_range") return "municipality beyond the department's count";
        // pattern caps the municipality at 33 (the largest department), nationid allows 00-99
        if (!r.ok && r.reason === "invalid_format" && !/(0[1-9]|[12]\d|3[0-3])$/.test(s)) return "municipality beyond the department's count";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("GT_NIT", () => {
  test("check character incl. K", () => {
    expect(v("GT_NIT", "1234567-9")).toMatchObject({ ok: true, formatted: "1234567-9" });
    const k = ["576771", "1000", "39"].map((b) => b + gtNitCheck(b));
    expect(k.map((x) => v("GT_NIT", x).ok)).toEqual([true, true, true]);
    let bodyK = "";
    for (let i = 100; !bodyK; i++) if (gtNitCheck(String(i)) === "K") bodyK = String(i);
    expect(v("GT_NIT", bodyK + "k")).toMatchObject({ ok: true });
    expect(v("GT_NIT", "12345678")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("GT_NIT", "1111111" + gtNitCheck("1111111"))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "GT_NIT"),
      generate: (r) => {
        const body = fromTemplate("#".repeat(1 + Math.floor(r() * 12)), r);
        return body + (r() < 0.7 ? gtNitCheck(body) : fromTemplate("[0-9K]", r));
      },
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("GT_PASAPORTE", () => {
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "GT_PASAPORTE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "X#######" : "X########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
