/**
 * Rules every document module must follow. Call `describeContract(documents)`
 * from a country's test file; test/contract.test.ts runs it over the registry.
 */
import { describe, expect, test } from "vitest";
import { alpha3Of } from "../../src/core/countries.js";
import { compact } from "../../src/core/normalize.js";
import type { DocumentSpec } from "../../src/core/types.js";
import { runDocument } from "../../src/core/run.js";
import { REF } from "./oracle.js";

export function describeContract(docs: readonly DocumentSpec[]) {
  describe.each(docs.map((d) => [d.code, d] as const))("contract %s", (code, d) => {
    test("metadata", () => {
      expect(alpha3Of(d.country), "country must be ISO alpha-2").toBeDefined();
      expect(code.startsWith(d.country + "_"), "code is {ALPHA2}_{TYPE}").toBe(true);
      expect(code).toMatch(/^[A-Z]{2}_[A-Z0-9_]+$/);
      expect(d.sources.length, "cite at least one source").toBeGreaterThan(0);
      expect(d.lengths.length).toBeGreaterThan(0);
    });

    test("example is valid and normalises to itself", () => {
      const { normalized, outcome } = runDocument(d, d.example, REF);
      expect(outcome, `example ${d.example}`).toMatchObject({ ok: true });
      expect(normalized).toBe(d.example);
      const formatted = d.format ? d.format(d.example) : d.example;
      expect(runDocument(d, formatted, REF).outcome.ok, `formatted ${formatted}`).toBe(true);
    });

    test("extracted data is JSON-safe", () => {
      const { outcome } = runDocument(d, d.example, REF);
      if (!outcome.ok) return;
      for (const v of Object.values(outcome.data.extra)) expect(["string", "number", "boolean"]).toContain(typeof v);
      if (outcome.data.dateOfBirth) expect(outcome.data.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test.runIf(d.checksum)("changing the check character breaks it", () => {
      const ex = d.example;
      const at = (d.checkIndex ?? -1) < 0 ? ex.length + (d.checkIndex ?? -1) : d.checkIndex!;
      const current = ex[at]!;
      const pool = /\d/.test(current) ? "0123456789" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const alsoValid = [...pool].filter(
        (c) => c !== current && runDocument(d, ex.slice(0, at) + c + ex.slice(at + 1), REF).outcome.ok,
      );
      if (d.checkUnique === false) expect(alsoValid.length, "check must still reject most values").toBeLessThanOrEqual(1);
      else expect(alsoValid, `other characters at index ${at} that also validate`).toEqual([]);
    });

    test("garbage is rejected without throwing", () => {
      for (const bad of ["", "   ", "0", "!!!", "x".repeat(40), compact(d.example) + "9"]) {
        expect(runDocument(d, bad, REF).outcome.ok, JSON.stringify(bad)).toBe(false);
      }
    });
  });
}
