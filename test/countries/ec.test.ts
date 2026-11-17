import { describe, expect, test } from "vitest";
import { documents, ecCedulaCheckDigit } from "../../src/countries/ec.js";
import { weightedSum } from "../../src/core/algorithms.js";
import { identify } from "../../src/identify.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string, ref: Date = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const cedula = (body9: string) => body9 + ecCedulaCheckDigit(body9);
const mod11 = (body: string, w: number[]) => {
  const r = weightedSum(body, w) % 11;
  return r === 0 ? 0 : 11 - r;
};

describe("Ecuador", () => {
  test("cédula", () => {
    expect(validateDocument("EC_CEDULA", "1710034065")).toMatchObject({
      ok: true,
      formatted: "1710034065",
      data: { region: "17", regionName: "Pichincha", serial: "003406", extra: {} },
    });
    expect(validateDocument("EC_CEDULA", "171003406-5").ok).toBe(true);
    expect(validateDocument("EC_CEDULA", cedula("301234567"))).toMatchObject({ ok: true, data: { region: "30" } });
    expect(validateDocument("EC_CEDULA", "1710034064")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("EC_CEDULA", cedula("251003406"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(validateDocument("EC_CEDULA", cedula("176003406"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(validateDocument("EC_CEDULA", "171003406")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("RUC", () => {
    expect(validateDocument("EC_RUC", "1710034065001")).toMatchObject({
      ok: true,
      data: { region: "17", regionName: "Pichincha", extra: { kind: "natural", cedula: "1710034065" } },
    });
    expect(validateDocument("EC_RUC", "1790011674001")).toMatchObject({
      ok: true,
      data: { region: "17", extra: { kind: "private", checkDigitValid: true } },
    });
    const pub = "17600000";
    const pubCheck = mod11(pub, [3, 2, 7, 6, 5, 4, 3, 2]);
    const pubRuc = pub + pubCheck + "0001";
    expect(validateDocument("EC_RUC", pubRuc)).toMatchObject({ ok: true, data: { extra: { kind: "public", checkDigitValid: true } } });
    expect(validateDocument("EC_RUC", pubRuc.slice(0, 9) + "1001")).toMatchObject({ ok: false, reason: "invalid_format" });
    // SRI: types 6 and 9 have no fixed check algorithm, so a mod-11 miss is reported, not rejected.
    expect(validateDocument("EC_RUC", "1790011675001")).toMatchObject({
      ok: true,
      data: { extra: { kind: "private", checkDigitValid: false } },
    });
    expect(validateDocument("EC_RUC", pub + ((pubCheck + 1) % 10) + "0001")).toMatchObject({
      ok: true,
      data: { extra: { kind: "public", checkDigitValid: false } },
    });
    expect(validateDocument("EC_RUC", "1710034064001")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("EC_RUC", "1710034065002")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(validateDocument("EC_RUC", "1770034065001")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("identify reports an unverified company RUC check digit per number", () => {
    const opts = { purposes: ["tax" as const], holders: ["entity" as const, "both" as const], referenceDate: REF };
    const ok = identify("1790011674001", { ...opts, country: "EC" });
    expect(ok.match?.checksumVerified).toBe(true);
    const miss = identify("1790011675001", { ...opts, country: "EC" });
    expect(miss.status).toBe("valid");
    expect(miss.match?.checksumVerified).toBe(false);
    // Guessing the country: an unverified check digit is not evidence.
    expect(identify("1790011675001", opts).matches.some((m) => m.country === "EC")).toBe(false);
    expect(identify("1790011674001", opts).matches.some((m) => m.country === "EC")).toBe(true);
  });

  test("passport", () => {
    expect(validateDocument("EC_PASAPORTE", "a1234567 8")).toMatchObject({ ok: true, normalized: "A12345678" });
    expect(validateDocument("EC_PASAPORTE", "A1234567")).toMatchObject({ ok: true });
    expect(validateDocument("EC_PASAPORTE", "A123456")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const cedGen = (r: () => number) => fromTemplate("[0-3]#[0-6]#######", r);
  test("cédula agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "EC_CEDULA"), generate: cedGen, samples: 8000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("cédula agrees with idnumbers except province 30", () => {
    const res = compareWithOracle({
      spec: spec(documents, "EC_CEDULA"),
      generate: cedGen,
      samples: 8000,
      // idnumbers' unsourced narrowing of province 30 to third digit 4-5 is not applied.
      allow: (s, ours) => (ours && s.startsWith("30") && s[2]! < "4" ? "province 30 accepts third digit 0-5" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("RUC agrees with nationid except the fixed 001 suffix", () => {
    const res = compareWithOracle({
      spec: spec(documents, "EC_RUC"),
      generate: (r) => {
        const k = r();
        const body = k < 0.3 ? "[0-2]#[0-5]#######" : k < 0.6 ? "[0-2]#9#######" : k < 0.9 ? "[0-2]#6######0" : "[0-3]#[0-9]#######";
        return fromTemplate(body + (r() < 0.8 ? "001" : "0[0-3][0-9]"), r);
      },
      samples: 10000,
      allow: (s, ours) => {
        if (ours) {
          // nationid rejects type 6/9 mod-11 failures; SRI publishes no fixed algorithm for them.
          const v = validateDocument("EC_RUC", s);
          return v.ok && v.data.extra.checkDigitValid === false ? "type 6/9 RUC accepted without mod-11 match" : undefined;
        }
        const v = validateDocument("EC_RUC", s);
        return !v.ok && v.reason === "invalid_format" && s.slice(10) !== "001" ? "RUC suffix must be 001" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("passport agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "EC_PASAPORTE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "X#######" : "XX#######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
