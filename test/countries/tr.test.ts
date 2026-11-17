import { describe, expect, test } from "vitest";
import { documents, tcknCheckDigits } from "../../src/countries/tr.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const TR = spec(documents, "TR_TCKN");
describeContract(documents);

/** personal-identity-validation ValidatorTUR, as published (negative `%` included). */
function pivTur(v: string): boolean {
  if (!/^[1-9]\d{10}$/.test(v)) return false;
  const d = [...v].map(Number);
  if (d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 !== d[10]) return false;
  const odd = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
  const even = d[1]! + d[3]! + d[5]! + d[7]!;
  return (odd * 7 - even) % 10 === d[9];
}

describe("TR_TCKN", () => {
  test("valid numbers", () => {
    expect(check(TR, "10000000146")).toMatchObject({ ok: true, formatted: "10000000146", data: { extra: { kind: "tc-kimlik" } } });
    expect(check(TR, "10000000146")).not.toHaveProperty("data.citizenship");
    expect(check(TR, "123 456 789 50").ok).toBe(true);
    expect(check(TR, "19090909018").ok).toBe(true); // negative C10 intermediate
    expect(pivTur("19090909018"), "personal-identity-validation bug").toBe(false);
  });

  test("foreigner numbers (99 prefix)", () => {
    const n = "991234567" + tcknCheckDigits("991234567");
    expect(check(TR, n)).toMatchObject({ ok: true, data: { citizenship: "foreigner", extra: { kind: "yabanci-kimlik" } } });
  });

  test("rejections", () => {
    expect(check(TR, "10000000147")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(TR, "10000000136")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(TR, "00000000000")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TR, "1000000014")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => {
    const body = fromTemplate("[1-9]########", r);
    return r() < 0.5 ? body + tcknCheckDigits(body) : fromTemplate("[1-9]##########", r);
  };

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({ spec: TR, generate: gen, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with personal-identity-validation except its negative-remainder bug", () => {
    const res = compareWithOracle({
      spec: TR,
      generate: gen,
      samples: 5000,
      allow: (s, ours) => {
        const d = [...s].map(Number);
        const raw = (d[0]! + d[2]! + d[4]! + d[6]! + d[8]!) * 7 - (d[1]! + d[3]! + d[5]! + d[7]!);
        return ours && raw < 0 ? "C10 uses a non-negative remainder" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
