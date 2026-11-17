import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/cr.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("Costa Rica", () => {
  test("cédula física", () => {
    expect(v("CR_CEDULA_FISICA", "1-1234-5678")).toMatchObject({
      ok: true,
      formatted: "1-1234-5678",
      data: { region: "1", regionName: "San José", citizenship: "citizen", serial: "12345678", extra: { tomo: "1234", asiento: "5678" } },
    });
    expect(v("CR_CEDULA_FISICA", "811112222")).toMatchObject({ ok: true, data: { regionName: "Naturalized citizen", citizenship: "naturalized_citizen" } });
    expect(v("CR_CEDULA_FISICA", "012345678")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("CR_CEDULA_FISICA", "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("cédula jurídica classes and NITE", () => {
    expect(v("CR_CEDULA_JURIDICA", "3-101-123456")).toMatchObject({ ok: true, data: { extra: { kind: "legal_person", entityType: "101" } } });
    expect(v("CR_CEDULA_JURIDICA", "2-100-042011")).toMatchObject({ ok: true, data: { extra: { kind: "government" } } });
    expect(v("CR_CEDULA_JURIDICA", "4-000-045127")).toMatchObject({ ok: true, data: { extra: { kind: "autonomous_institution" } } });
    expect(v("CR_CEDULA_JURIDICA", "5101123456")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("CR_NITE", "3-130-000123")).toMatchObject({ ok: true, data: { extra: { kind: "entity" } } });
    expect(v("CR_NITE", "3-101-000123")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("DIMEX and passport", () => {
    expect(v("CR_DIMEX", "12233445566")).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
    expect(v("CR_DIMEX", "1234567890")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("CR_PASAPORTE", "c12345678")).toMatchObject({ ok: true, normalized: "C12345678" });
    expect(v("CR_PASAPORTE", "C1234567@")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers (CRI)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CR_CEDULA_FISICA"),
      generate: (r) => fromTemplate("[0-9]########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid", () => {
    const cases: [string, string, string, ((s: string, ours: boolean) => string | undefined)?][] = [
      ["CR_CEDULA_FISICA", "CR_CEDULA_FISICA", "[0-9]########"],
      ["CR_DIMEX", "CR_DIMEX", "[0-9]##########"],
      ["CR_DIMEX", "CR_DIMEX", "[0-9]###########"],
      [
        "CR_CEDULA_JURIDICA",
        "CR_CEDULA_JURIDICA",
        "[1-5]#########",
        (s, ours) => (ours && (s[0] === "2" || s[0] === "4") ? "government (2) and autonomous (4) classes accepted" : undefined),
      ],
      ["CR_PASAPORTE", "CR_PASAPORTE", "[A-Z0-9][0-9]#######"],
    ];
    for (const [ours, , tpl, allow] of cases) {
      const res = compareWithOracle({
        spec: spec(documents, ours),
        generate: (r) => fromTemplate(tpl, r),
        allow,
      });
      expect(res.unexplained, ours).toEqual([]);
      expect(res.validSeen, ours).toBeGreaterThan(20);
    }
  });
});
