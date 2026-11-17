import { describe, expect, test } from "vitest";
import { documents, nitCheckDigit } from "../../src/countries/co.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("Colombia", () => {
  test("NIT", () => {
    expect(nitCheckDigit("900123456")).toBe(8);
    expect(v("CO_NIT", "900.123.456-8")).toMatchObject({
      ok: true,
      formatted: "900.123.456-8",
      data: { serial: "900123456", extra: { checkDigit: 8 } },
    });
    // natural person: 8-digit cédula + DV (rejected by nationid)
    const nat = "12345678" + nitCheckDigit("12345678");
    expect(v("CO_NIT", nat)).toMatchObject({ ok: true });
    expect(v("CO_NIT", "9001234567")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("CO_NIT", "0000000000")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("CO_NIT", "123456")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("identity and migratory documents", () => {
    expect(v("CO_CC", "1.020.304.050")).toMatchObject({ ok: true, formatted: "1.020.304.050", data: { citizenship: "citizen" } });
    expect(v("CO_CC", "12345")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("CO_TI", "10123456789")).toMatchObject({ ok: true });
    expect(v("CO_CE", "123456")).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
    expect(v("CO_PEP", "123456789012345")).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
    expect(v("CO_PPT", "ab12345")).toMatchObject({ ok: true, normalized: "AB12345" });
    expect(v("CO_PASAPORTE", "AB12345#")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  const nitGen = (lo: number, hi: number) => (r: () => number) => {
    const len = lo + Math.floor(r() * (hi - lo + 1));
    const base = r() < 0.03 ? "0".repeat(len) : fromTemplate("[1-9]" + "#".repeat(len - 1), r);
    return base + (r() < 0.5 ? nitCheckDigit(base) : fromTemplate("#", r));
  };
  const placeholder = (s: string, ours: boolean) =>
    !ours && /^(\d)\1+$/.test(s.slice(0, -1)) ? "all-same-digit placeholder rejected" : undefined;

  test("agrees with idnumbers (COL, which is the NIT algorithm)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CO_NIT"),
      generate: nitGen(8, 9),
      allow: placeholder,
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid CO_NIT except short bases", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CO_NIT"),
      generate: nitGen(6, 10),
      allow: (s, ours) => (ours && s.length < 10 ? "6-8 digit cédula as NIT base accepted" : undefined),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid on format-only documents", () => {
    const cases: [string, (r: () => number) => string][] = [
      ["CO_CC", (r) => fromTemplate("#".repeat(5 + Math.floor(r() * 7)), r)],
      ["CO_TI", (r) => fromTemplate("#".repeat(9 + Math.floor(r() * 4)), r)],
      ["CO_CE", (r) => fromTemplate("#".repeat(5 + Math.floor(r() * 5)), r)],
      ["CO_PEP", (r) => fromTemplate("#".repeat(14 + Math.floor(r() * 3)), r)],
      ["CO_PPT", (r) => fromTemplate("X".repeat(6 + Math.floor(r() * 7)), r)],
      ["CO_PASAPORTE", (r) => fromTemplate("X".repeat(5 + Math.floor(r() * 9)), r)],
    ];
    for (const [code, generate] of cases) {
      const res = compareWithOracle({ spec: spec(documents, code), generate });
      expect(res.unexplained, code).toEqual([]);
      expect(res.validSeen, code).toBeGreaterThan(20);
    }
  });
});
