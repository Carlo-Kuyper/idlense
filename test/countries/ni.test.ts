import { describe, expect, test } from "vitest";
import { documents, niCedulaLetter } from "../../src/countries/ni.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const ced = (d13: string) => d13 + niCedulaLetter(d13);

describe("NI_CEDULA", () => {
  test("extracts everything", () => {
    expect(v("NI_CEDULA", "001-010190-0001n")).toMatchObject({
      ok: true,
      formatted: "001-010190-0001N",
      data: { dateOfBirth: "1990-01-01", birthYear: 1990, region: "001", serial: "0001" },
    });
    expect(v("NI_CEDULA", ced("2811511150022"))).toMatchObject({ ok: true, data: { dateOfBirth: "2015-11-15" } });
    expect(v("NI_CEDULA", ced("2811711260022"))).toMatchObject({ ok: true, data: { dateOfBirth: "1926-11-17" } });
  });

  test("check letter is the 13 digits mod 23", () => {
    expect(niCedulaLetter("0000000000000")).toBe("A");
    expect(niCedulaLetter("0000000000022")).toBe("Y");
    expect(niCedulaLetter("0000000000023")).toBe("A");
  });

  test("rejections", () => {
    expect(v("NI_CEDULA", "0010101900001M")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("NI_CEDULA", ced("0013002900001"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("NI_CEDULA", ced("0000101900001"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("NI_CEDULA", "0010101900001I")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NI_CEDULA"),
      generate: (r) => {
        const d = fromTemplate("###[0-3]#[01]#######", r);
        return d + (r() < 0.6 ? niCedulaLetter(d) : fromTemplate("A", r));
      },
      samples: 5000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = v("NI_CEDULA", s);
        if (r.ok) return undefined;
        if (r.reason === "invalid_checksum") return "mod-23 check letter verified";
        if (r.reason === "invalid_date") return "impossible or future birth date rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("NI_RUC", () => {
  test("forms", () => {
    expect(v("NI_RUC", "001-010190-0001N")).toMatchObject({ ok: true, data: { dateOfBirth: "1990-01-01", extra: { kind: "person" } } });
    expect(v("NI_RUC", "J0310000123456")).toMatchObject({ ok: true, data: { extra: { kind: "entity" } } });
    expect(v("NI_RUC", "0010101900001M")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("NI_RUC", "X0310000123456")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NI_RUC"),
      generate: (r) => {
        const roll = r();
        if (roll < 0.3) return fromTemplate("J#############", r);
        if (roll < 0.5) return fromTemplate("##############", r);
        const d = fromTemplate("###[0-3]#[01]#######", r);
        return d + (r() < 0.6 ? niCedulaLetter(d) : fromTemplate("A", r));
      },
      samples: 5000,
      allow: (s, ours) => {
        if (ours) return /^J\d{13}$/.test(s) ? "entity RUC J + 13 digits accepted" : undefined;
        const r = v("NI_RUC", s);
        if (r.ok) return undefined;
        if (/^\d{13}[A-Z]$/.test(s) && ["invalid_checksum", "invalid_date", "invalid_range", "invalid_format"].includes(r.reason))
          return "person RUC checked as a cédula";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("NI_PASAPORTE", () => {
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NI_PASAPORTE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "[A-Z0-9]#######" : "[A-Z0-9]######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
