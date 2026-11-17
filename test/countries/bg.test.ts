import { describe, expect, test } from "vitest";
import { weightedSum } from "../../src/core/algorithms.js";
import { documents, egnCheckDigit, lnchCheckDigit, uicCheckDigit } from "../../src/countries/bg.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const EGN = spec(documents, "BG_EGN");
const LNCH = spec(documents, "BG_LNCH");
const VAT = spec(documents, "BG_VAT");
describeContract(documents);

const egn = (b: string) => b + egnCheckDigit(b);

describe("BG_EGN", () => {
  test("extracts everything", () => {
    expect(check(EGN, "8001016243")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1980-01-01",
        birthYear: 1980,
        gender: "male",
        region: "624",
        regionName: "София (град)",
        serial: "624",
      },
    });
    expect(check(EGN, egn("800101001"))).toMatchObject({ ok: true, data: { gender: "female", regionName: "Благоевград" } });
    expect(check(EGN, egn("800101999"))).toMatchObject({ ok: true, data: { regionName: "Друг/неизвестен" } });
  });

  test("century offsets", () => {
    expect(check(EGN, egn("052101632"))).toMatchObject({ ok: true, data: { dateOfBirth: "1805-01-01" } });
    expect(check(EGN, "0545016326")).toMatchObject({ ok: true, data: { dateOfBirth: "2005-05-01" } });
    expect(check(EGN, egn("275201001"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 2027, future
    expect(check(EGN, egn("010229001"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 1901-02-29
    expect(check(EGN, "8013016243")).toMatchObject({ ok: false, reason: "invalid_format" }); // month 13
  });

  test("remainder 10 → check digit 0 (idnumbers rejects these)", () => {
    let body = "";
    for (let n = 0; n < 1000 && !body; n++) {
      const b = "800101" + String(n).padStart(3, "0");
      if (weightedSum(b, [2, 4, 8, 5, 10, 9, 7, 3, 6]) % 11 === 10) body = b;
    }
    expect(check(EGN, body + "0").ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(EGN, "8001016244")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(EGN, "800101624")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: EGN,
      generate: (r) => {
        const b = fromTemplate("##[0-5]#[0-3]####", r);
        return r() < 0.8 ? egn(b) : b + fromTemplate("#", r);
      },
      samples: 20000,
      allow: (s, ours) => {
        if (ours && s[9] === "0" && weightedSum(s, [2, 4, 8, 5, 10, 9, 7, 3, 6]) % 11 === 10) return "remainder 10 → 0";
        const r = check(EGN, s);
        if (!ours && !r.ok && r.reason === "invalid_date") return "future birth date rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BG_LNCH", () => {
  test("check digit", () => {
    expect(check(LNCH, "1001000004")).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
    expect(check(LNCH, "1234567893")).toMatchObject({ ok: true });
    expect(check(LNCH, "1234567890")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(lnchCheckDigit("123456789")).toBe(3);
  });
});

describe("BG_VAT", () => {
  test("forms", () => {
    expect(check(VAT, "BG 123456786")).toMatchObject({ ok: true, normalized: "123456786", data: { extra: { kind: "uic" } } });
    expect(check(VAT, "207258749")).toMatchObject({ ok: true });
    expect(check(VAT, "123456785")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(VAT, "BG8001016243")).toMatchObject({ ok: true, data: { extra: { kind: "egn" } } });
    expect(check(VAT, "1234567893")).toMatchObject({ ok: true, data: { extra: { kind: "lnch" } } });
    expect(check(VAT, "8001016244")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(VAT, "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen9 = (r: () => number) => {
    const b = fromTemplate("########", r);
    return r() < 0.5 ? b + uicCheckDigit(b) : b + fromTemplate("#", r);
  };

  test("agrees with nationid BG_VAT (9-digit form)", () => {
    const res = compareWithOracle({ spec: VAT, generate: gen9, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers UnifiedIdCode (9-digit form)", () => {
    const res = compareWithOracle({ spec: VAT, generate: gen9, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
