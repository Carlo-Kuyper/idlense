import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/is.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

describe("IS_KENNITALA", () => {
  test("extracts everything", () => {
    expect(v("IS_KENNITALA", "120174-3399")).toMatchObject({
      ok: true,
      formatted: "120174-3399",
      data: { dateOfBirth: "1974-01-12", birthYear: 1974, serial: "33", extra: { legacyCheckDigit: true } },
    });
    expect(v("IS_KENNITALA", "120174 3399")).toMatchObject({ ok: true });
  });

  test("century digit and the dropped check digit", () => {
    expect(v("IS_KENNITALA", "1201743309")).toMatchObject({ ok: true, data: { extra: { legacyCheckDigit: false } } });
    expect(v("IS_KENNITALA", "0101993398")).toMatchObject({ ok: true, data: { dateOfBirth: "1899-01-01" } });
    expect(v("IS_KENNITALA", "0101103390")).toMatchObject({ ok: true, data: { dateOfBirth: "2010-01-01" } });
    expect(v("IS_KENNITALA", "0101993390")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2099
    expect(v("IS_KENNITALA", "3002743399")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("IS_KENNITALA", "1201743391")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IS_KENNITALA", "120174339")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("legal entities: day + 40", () => {
    expect(v("IS_KENNITALA_ENTITY", "590269-7199")).toMatchObject({ ok: true, data: { extra: { registrationYear: 1969 } } });
    expect(v("IS_KENNITALA", "5902697199")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IS_KENNITALA_ENTITY", "7002697199")).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("VSK", () => {
    expect(v("IS_VSK", "IS 12345")).toMatchObject({ ok: true, normalized: "12345" });
    expect(v("IS_VSK", "1234")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("upstream comparison", () => {
  test("idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IS_KENNITALA"),
      generate: (r) => fromTemplate("[0-3]#[01]######[890]", r),
      samples: 10000,
      allow: (s, ours) => {
        const r = v("IS_KENNITALA", s);
        // idnumbers 2.3.0 still enforces the check digit Þjóðskrá dropped on 2026-02-18 and rejects century 8.
        if (ours && s[9] === "8") return "1800s century digit 8 accepted";
        if (ours && r.ok && r.data.extra.legacyCheckDigit === true && s[8] === "1") return "check digit 1 (remainder 10) is valid";
        if (ours) return r.ok && r.data.extra.legacyCheckDigit === false ? "legacy check digit not enforced" : undefined;
        return !r.ok && r.reason === "invalid_date" ? "future birth date rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid IS_VSK", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IS_VSK"),
      generate: (r) => fromTemplate(r() < 0.5 ? "#####" : "######", r),
      samples: 1000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
