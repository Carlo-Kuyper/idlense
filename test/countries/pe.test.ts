import { describe, expect, test } from "vitest";
import { weightedSum } from "../../src/core/algorithms.js";
import { documents, peRucCheckDigit } from "../../src/countries/pe.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string, ref: Date = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const ruc = (body10: string) => body10 + peRucCheckDigit(body10);
const W = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

describe("Peru", () => {
  test("DNI", () => {
    expect(validateDocument("PE_DNI", "12345678")).toMatchObject({ ok: true, data: { serial: "12345678" } });
    expect(validateDocument("PE_DNI", "1234567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("RUC", () => {
    expect(validateDocument("PE_RUC", "20131312955")).toMatchObject({
      ok: true,
      formatted: "20-13131295-5",
      data: { serial: "13131295", extra: { kind: "legal_entity" } },
    });
    expect(validateDocument("PE_RUC", "20-13131295-5").ok).toBe(true);
    expect(validateDocument("PE_RUC", ruc("1012345678"))).toMatchObject({
      ok: true,
      data: { extra: { kind: "natural_person_dni", dni: "12345678" } },
    });
    expect(validateDocument("PE_RUC", "20131312954")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("PE_RUC", "30131312955")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(validateDocument("PE_RUC", "20503644968")).toMatchObject({ ok: true, data: { serial: "50364496", extra: { kind: "legal_entity" } } });
    expect(validateDocument("PE_RUC", "20503644961")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("RUC kinds 16 / 17 (Oracle Peru tax docs)", () => {
    expect(validateDocument("PE_RUC", ruc("1612345678"))).toMatchObject({ ok: true, data: { extra: { kind: "legacy" } } });
    expect(validateDocument("PE_RUC", ruc("1712345678"))).toMatchObject({ ok: true, data: { extra: { kind: "legacy_or_foreigner" } } });
  });

  test("RUC check digit: remainder 0 → 1, remainder 1 → 0", () => {
    // Find bodies with each remainder and check SUNAT's mapping.
    const r0 = ["2000000000", "2000000001", "2000000002", "2000000003", "2000000004", "2000000005", "2000000006", "2000000007", "2000000008", "2000000009", "2000000010"];
    const byRem = new Map(r0.map((b) => [weightedSum(b, W) % 11, b]));
    expect(peRucCheckDigit(byRem.get(0)!)).toBe(1);
    expect(peRucCheckDigit(byRem.get(1)!)).toBe(0);
  });

  test("carné de extranjería and passport", () => {
    expect(validateDocument("PE_CE", "001234567")).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
    expect(validateDocument("PE_CE", "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(validateDocument("PE_PASAPORTE", "a12345678")).toMatchObject({ ok: true, normalized: "A12345678" });
    expect(validateDocument("PE_PASAPORTE", "AB1234567")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("RUC agrees with nationid except the 10/11 mapping", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PE_RUC"),
      generate: (r) => fromTemplate("[123][05-7]#########", r),
      samples: 10000,
      // nationid swaps SUNAT's mapping: only bodies with remainder 0 or 1 may disagree.
      allow: (s) => (weightedSum(s, W) % 11 <= 1 ? "SUNAT maps 10 → 0 and 11 → 1" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(Object.keys(res.explained)).toHaveLength(1);
  });

  for (const [code, tpl, min, max] of [
    ["PE_DNI", "#########", 7, 9],
    ["PE_CE", "#############", 8, 13],
    ["PE_PASAPORTE", "[A-C0-9]#########", 7, 10],
  ] as const) {
    test(`${code} agrees with nationid`, () => {
      const res = compareWithOracle({
        spec: spec(documents, code),
        generate: (r) => fromTemplate(tpl, r).slice(0, min + Math.floor(r() * (max - min + 1))),
      });
      expect(res.unexplained).toEqual([]);
      expect(res.validSeen).toBeGreaterThan(20);
    });
  }
});
