import { describe, expect, test } from "vitest";
import { weightedSum } from "../../src/core/algorithms.js";
import { documents, uyCiCheckDigit, uyRutCheckDigit } from "../../src/countries/uy.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string, ref: Date = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

/** nationid's RUT check: weights reversed, remainder 1 → 1. Used only to explain disagreements. */
function nationidRutDigit(s: string): number {
  const r = weightedSum(s, [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4]) % 11;
  return r <= 1 ? r : 11 - r;
}

describe("Uruguay", () => {
  test("CI", () => {
    expect(validateDocument("UY_CI", "1.234.567-2")).toMatchObject({
      ok: true,
      normalized: "12345672",
      formatted: "1.234.567-2",
      data: { serial: "1234567" },
    });
    expect(validateDocument("UY_CI", "0" + "123456" + uyCiCheckDigit("0123456"))).toMatchObject({ ok: true, formatted: "0.123.456-" + uyCiCheckDigit("0123456") });
    expect(validateDocument("UY_CI", "1.234.567-3")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("UY_CI", "1.234.567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("RUT: real public-sector numbers", () => {
    // Printed in official procurement / MEF documents.
    for (const s of ["21 176335 0018", "21.933227.0010", "21.226390.0017"]) {
      expect(validateDocument("UY_RUT", s).ok, s).toBe(true);
    }
    expect(validateDocument("UY_RUT", "211763350018")).toMatchObject({
      ok: true,
      formatted: "21-176335-001-8",
      data: { serial: "176335", extra: { prefix: "21" } },
    });
  });

  test("RUT rejections", () => {
    expect(validateDocument("UY_RUT", "211763350017")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("UY_RUT", "211763350028")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(validateDocument("UY_RUT", "231763350018")).toMatchObject({ ok: false, reason: "invalid_format" });
    const zero = "21000000001";
    expect(validateDocument("UY_RUT", zero + uyRutCheckDigit(zero))).toMatchObject({ ok: false, reason: "invalid_format" });
    // Remainder 1 gives 10: no digit is valid.
    let body = "";
    for (let n = 100000; n < 999999 && !body; n++) if (uyRutCheckDigit(`21${n}001`) === 10) body = `21${n}001`;
    for (const d of "0123456789") expect(validateDocument("UY_RUT", body + d).ok).toBe(false);
  });

  test("passport", () => {
    expect(validateDocument("UY_PASAPORTE", "b123456")).toMatchObject({ ok: true, normalized: "B123456" });
    expect(validateDocument("UY_PASAPORTE", "B12345")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("CI agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "UY_CI"), generate: (r) => fromTemplate("########", r) });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("RUT agrees with nationid except the documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "UY_RUT"),
      generate: (r) => fromTemplate(r() < 0.9 ? "[0-2]#######001#" : "############", r),
      samples: 20000,
      allow: (s, ours) => {
        const v = validateDocument("UY_RUT", s);
        const d = Number(s[11]);
        if (ours) return nationidRutDigit(s) !== d ? "DGI weight order (nationid reverses it)" : undefined;
        if (v.ok) return undefined;
        if (v.reason === "invalid_format") return "prefix 01-22, non-zero sequence and fixed 001 block";
        if (v.reason === "invalid_checksum" && nationidRutDigit(s) === d) return "DGI weight order (nationid reverses it)";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("passport agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "UY_PASAPORTE"),
      generate: (r) => (r() < 0.8 ? fromTemplate("A######", r) : fromTemplate("X#######", r).slice(0, 6 + Math.floor(r() * 3))),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
