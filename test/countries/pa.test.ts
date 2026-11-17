import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/pa.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("Panama", () => {
  test("cédula", () => {
    expect(v("PA_CEDULA", "8-123-456")).toMatchObject({
      ok: true,
      normalized: "8-123-456",
      data: { region: "8", regionName: "Panamá", citizenship: "citizen", extra: { tomo: "123", asiento: "456", kind: "province" } },
    });
    expect(v("PA_CEDULA", "13-1234-567890")).toMatchObject({ ok: true, data: { regionName: "Panamá Oeste" } });
    expect(v("PA_CEDULA", "e-8-119286")).toMatchObject({ ok: true, data: { citizenship: "foreigner", extra: { kind: "foreign_resident" } } });
    expect(v("PA_CEDULA", "N-19-1234")).toMatchObject({ ok: true, data: { citizenship: "naturalized_citizen" } });
    expect(v("PA_CEDULA", "PE-12-345")).toMatchObject({ ok: true, data: { extra: { kind: "born_abroad" } } });
    expect(v("PA_CEDULA", "8-AV-12-345")).toMatchObject({ ok: true, normalized: "8AV-12-345", data: { region: "8", extra: { kind: "before_civil_registry" } } });
    expect(v("PA_CEDULA", "4PI-12-345")).toMatchObject({ ok: true, data: { extra: { kind: "indigenous" } } });
    expect(v("PA_CEDULA", "14-123-456")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("PA_CEDULA", "8-12345-1")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("PA_CEDULA", "8-1")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("RUC", () => {
    expect(v("PA_RUC", "8-123-456 DV 32")).toMatchObject({ ok: true, normalized: "8-123-456" });
    expect(v("PA_RUC", "E-8-119286")).toMatchObject({ ok: true, data: { extra: { holderType: "natural_person" } } });
    expect(v("PA_RUC", "155123456-2-2019 DV 12")).toMatchObject({
      ok: true,
      data: { serial: "155123456", extra: { holderType: "legal_person", entityClass: "company", registrationYear: 2019 } },
    });
    expect(v("PA_RUC", "155123456-2-2027")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("PA_RUC", "155123456-4-2019")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("passport", () => {
    expect(v("PA_PASAPORTE", "pa1234567")).toMatchObject({ ok: true, normalized: "PA1234567" });
    expect(v("PA_PASAPORTE", "ABC12345")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  const gen = (r: () => number) => {
    const t = fromTemplate("[0-9EPNX]", r);
    const head = t === "P" ? "PE" : t === "X" ? fromTemplate("1[0-5]", r) : t === "0" ? "8AV" : t;
    const tomo = fromTemplate("#".repeat(1 + Math.floor(r() * 5)), r);
    const asiento = fromTemplate("#".repeat(1 + Math.floor(r() * 7)), r);
    return `${head}-${tomo}-${asiento}`;
  };
  const avFix = (s: string, ours: boolean) => (ours && /^\d+(AV|PI)-/.test(s) ? "AV/PI cédula prefixes accepted" : undefined);

  test("agrees with nationid PA_CEDULA except AV/PI", () => {
    const res = compareWithOracle({ spec: spec(documents, "PA_CEDULA"), generate: gen, allow: avFix });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid PA_RUC except AV/PI and Folio Real", () => {
    const rucGen = (r: () => number) =>
      r() < 0.3 ? `${fromTemplate("1##" + "#".repeat(Math.floor(r() * 7)), r)}-${fromTemplate("[1-4]", r)}-${fromTemplate("[12][09]##", r)}` : gen(r);
    const res = compareWithOracle({
      spec: spec(documents, "PA_RUC"),
      generate: rucGen,
      allow: (s, ours) => avFix(s, ours) ?? (ours && /^\d{5,10}-[23]-\d{4}$/.test(s) ? "post-2014 Folio Real RUC accepted" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid PA_PASAPORTE", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PA_PASAPORTE"),
      generate: (r) => fromTemplate(["", "A", "AA", "AAA"][Math.floor(r() * 4)]! + "#".repeat(5 + Math.floor(r() * 5)), r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
