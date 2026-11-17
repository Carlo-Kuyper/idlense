import { describe, expect, test } from "vitest";
import { documents, lvPersonalCheckDigit } from "../../src/countries/lv.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const withCheck = (b: string) => b + lvPersonalCheckDigit(b);
const NEW = /^3[2-9]\d{9}$/;
describeContract(documents);

describe("LV_PERSONAS_KODS", () => {
  test("extracts everything", () => {
    expect(v("LV_PERSONAS_KODS", "010180-10000")).toMatchObject({
      ok: true,
      normalized: "01018010000",
      formatted: "010180-10000",
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, serial: "000" },
    });
    expect(v("LV_PERSONAS_KODS", withCheck("2902122345"))).toMatchObject({ ok: true, data: { dateOfBirth: "2012-02-29" } });
    expect(v("LV_PERSONAS_KODS", withCheck("3112990345"))).toMatchObject({ ok: true, data: { dateOfBirth: "1899-12-31" } });
  });

  test("rejections", () => {
    expect(v("LV_PERSONAS_KODS", "01018010001")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("LV_PERSONAS_KODS", withCheck("0101803000"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("LV_PERSONAS_KODS", withCheck("2902132345"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("LV_PERSONAS_KODS", withCheck("0101302345"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("LV_PERSONAS_KODS", "32123456789")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "LV_PERSONAS_KODS"),
      generate: (r) => fromTemplate("[0-3]#[01]##[0-3]#####", r),
      samples: 20000,
      allow: (s, ours) => {
        if (ours) return undefined;
        if (NEW.test(s)) return "post-2017 codes are LV_PERSONAS_KODS_NEW";
        const r = v("LV_PERSONAS_KODS", s);
        if (r.ok) return undefined;
        if (r.reason === "invalid_date") return "impossible or future birth date rejected";
        if (r.reason === "invalid_format") return "day/month/century digit checked";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("LV_PERSONAS_KODS_NEW", () => {
  test("shape only", () => {
    expect(v("LV_PERSONAS_KODS_NEW", "321234-56789")).toMatchObject({ ok: true, formatted: "321234-56789", data: { extra: {} } });
    expect(v("LV_PERSONAS_KODS_NEW", "31123456789")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "LV_PERSONAS_KODS_NEW"),
      generate: (r) => fromTemplate("3[2-9]#########", r),
      // idnumbers 2.3 applies the legacy check digit; the regulation defines none for these codes.
      allow: (_s, ours, theirs) => (ours && !theirs ? "post-2017 codes have no check digit" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("LV_VAT", () => {
  test("legal and natural persons", () => {
    expect(v("LV_VAT", "40003521600")).toMatchObject({ ok: true, normalized: "LV40003521600", data: { extra: { kind: "legal_person" } } });
    expect(v("LV_VAT", "LV40003521601")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("LV_VAT", "LV01018010000")).toMatchObject({ ok: true, data: { extra: { kind: "natural_person" } } });
    expect(v("LV_VAT", "LV32123456789")).toMatchObject({ ok: true, data: { extra: { kind: "natural_person" } } });
    expect(v("LV_VAT", "LV01018010001")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("LV_VAT", "LV31138010000")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "LV_VAT"),
      generate: (r) => (r() < 0.5 ? fromTemplate("LV[0-3]#[01]##[0-2]#####", r) : fromTemplate("LV[4-9]##########", r)),
      samples: 20000,
      allow: (s, ours) => {
        const body = s.slice(2);
        if (Number(body[0]) > 3) return undefined;
        if (ours) return NEW.test(body) ? "post-2017 personal codes carry no date" : undefined;
        const r = v("LV_VAT", s);
        if (r.ok) return undefined;
        if (r.reason === "invalid_checksum") return "natural-person check digit verified";
        if (r.reason === "invalid_date") return "natural-person birth date must be real and past";
        if (r.reason === "invalid_format" && Number(body[6]) > 2) return "century digit must be 0-2";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
