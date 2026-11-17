import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/il.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const IL = spec(documents, "IL_TZ");
describeContract(documents);

describe("IL_TZ", () => {
  test("valid numbers", () => {
    expect(check(IL, "123456782", REF)).toMatchObject({ ok: true, normalized: "123456782", formatted: "12345678-2", data: { extra: {} } });
    expect(check(IL, "12345678-2").ok).toBe(true);
    expect(check(IL, "000000018").ok).toBe(true);
  });

  test("leading zeros are restored", () => {
    expect(check(IL, "18")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(IL, "1234566")).toMatchObject({ ok: true, normalized: "001234566" });
    expect(check(IL, "01234566")).toMatchObject({ ok: true, normalized: "001234566" });
  });

  test("rejections", () => {
    expect(check(IL, "123456783")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(IL, "000000000")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(IL, "12345678A")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(IL, "1234567820")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => {
    const body = fromTemplate("########", r);
    return r() < 0.5 ? body + luhnCheckDigit(body) : fromTemplate("#########", r);
  };

  test("agrees with idnumbers except the all-zero number", () => {
    const res = compareWithOracle({
      spec: IL,
      generate: (r) => (r() < 0.01 ? "000000000" : gen(r)),
      allow: (s, ours) => (!ours && /^0+$/.test(s) ? "all-zero number rejected" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(res.explained).toHaveProperty("all-zero number rejected");
  });

  test("agrees with personal-identity-validation except leading zeros", () => {
    const res = compareWithOracle({
      spec: IL,
      generate: gen,
      allow: (s, ours) => (ours && s.startsWith("0") ? "leading zero accepted" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
