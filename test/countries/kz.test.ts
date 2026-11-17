import { describe, expect, test } from "vitest";
import { documents, kzCheckDigit } from "../../src/countries/kz.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const withCheck = (b: string) => b + kzCheckDigit(b + "0");
describeContract(documents);

describe("KZ_IIN", () => {
  test("extracts everything", () => {
    expect(v("KZ_IIN", "800101300016")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "male", serial: "0001" },
    });
    expect(v("KZ_IIN", withCheck("12022960012"))).toMatchObject({ ok: true, data: { dateOfBirth: "2012-02-29", gender: "female" } });
  });

  test("foreign citizens (G = 0)", () => {
    const r = v("KZ_IIN", withCheck("85061500012"));
    expect(r).toMatchObject({ ok: true, data: { dateOfBirth: "1985-06-15", citizenship: "foreigner" } });
    expect(r.ok && r.data.gender).toBeUndefined();
  });

  test("rejections", () => {
    expect(v("KZ_IIN", "800101300017")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("KZ_IIN", withCheck("80010170001"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("KZ_IIN", withCheck("27010150001"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("KZ_IIN", withCheck("01022950001"))).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "KZ_IIN"),
      generate: (r) => fromTemplate("##[01]#[0-3]#[0-7]#####", r),
      samples: 20000,
      allow: (s, ours) => {
        if (ours) return s[6] === "0" ? "G = 0 (foreign citizens) accepted" : undefined;
        const r = v("KZ_IIN", s);
        return !r.ok && r.reason === "invalid_date" ? "future birth date rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("KZ_BIN", () => {
  test("extracts the structure", () => {
    expect(v("KZ_BIN", "100140000003")).toMatchObject({
      ok: true,
      data: { serial: "00000", extra: { entityType: "resident_legal_entity", division: "head_office", registered: "10-01" } },
    });
    expect(v("KZ_BIN", withCheck("15035100012"))).toMatchObject({
      ok: true,
      data: { extra: { entityType: "non_resident_legal_entity", division: "branch" } },
    });
    expect(v("KZ_BIN", "100140000004")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("KZ_BIN", withCheck("10134000000"))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers except the month check", () => {
    const res = compareWithOracle({
      spec: spec(documents, "KZ_BIN"),
      generate: (r) => fromTemplate("##[01]#[4-6][0-3]######", r),
      samples: 20000,
      allow: (s, ours) => {
        const m = Number(s.slice(2, 4));
        return !ours && (m < 1 || m > 12) ? "registration month must be 01-12" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("KZ_BIN AIFC serials", () => {
  test("serials 90001-99999 are flagged", () => {
    for (const serial of ["90001", "95000", "99999"]) {
      expect(v("KZ_BIN", withCheck("180140" + serial)), serial).toMatchObject({ ok: true, data: { serial, extra: { aifc: true } } });
    }
  });
  test("other serials are not", () => {
    for (const serial of ["00000", "90000", "89999"]) {
      const r = v("KZ_BIN", withCheck("180140" + serial));
      expect(r.ok, serial).toBe(true);
      expect(r.ok && r.data.extra.aifc, serial).toBeUndefined();
    }
  });
});
