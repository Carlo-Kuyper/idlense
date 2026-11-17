import { describe, expect, test } from "vitest";
import { documents, hkidCheckChar } from "../../src/countries/hk.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const HK = spec(documents, "HK_HKID");
const v = (s: string) => check(HK, s, REF);
describeContract(documents);

describe("HK_HKID", () => {
  test("one-letter prefix", () => {
    expect(v("A123456(3)")).toMatchObject({
      ok: true,
      normalized: "A1234563",
      formatted: "A123456(3)",
      data: { serial: "123456", extra: { prefix: "A", checkDigit: "3" } },
    });
    expect(v("a 123456 (3)").ok).toBe(true);
    expect(v("Ａ１２３４５６（３）").ok).toBe(true);
  });

  test("two-letter prefix and check character A", () => {
    const body = "XA123456";
    const full = body + hkidCheckChar(body);
    expect(v(full)).toMatchObject({ ok: true, data: { extra: { prefix: "XA" } } });
    // Find a body whose check value is 10 (written A).
    let n = 0;
    while (hkidCheckChar("B" + String(n).padStart(6, "0")) !== "A") n++;
    const withA = "B" + String(n).padStart(6, "0") + "A";
    expect(v(withA)).toMatchObject({ ok: true, data: { extra: { checkDigit: "A" } } });
  });

  test("rejections", () => {
    expect(v("A1234564")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("A123456B")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("1A234563")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("A123456")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: HK,
      generate: (r) => (r() < 0.5 ? fromTemplate("A######[0-9A]", r) : fromTemplate("AA######[0-9A]", r)),
      samples: 10000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
