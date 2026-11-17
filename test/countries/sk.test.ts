import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/sk.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const mod11 = (s: string) => [...s].reduce((r, c) => (r * 10 + Number(c)) % 11, 0);
const withCheck = (b: string) => {
  for (let d = 0; d < 10; d++) if (mod11(b + d) === 0) return b + d;
  return b + "0";
};

describe("SK_RC", () => {
  test("extracts everything", () => {
    expect(v("SK_RC", "710319/2745")).toMatchObject({
      ok: true,
      formatted: "710319/2745",
      data: { dateOfBirth: "1971-03-19", birthYear: 1971, gender: "male", serial: "2745" },
    });
    expect(v("SK_RC", withCheck("856012345"))).toMatchObject({ ok: true, data: { dateOfBirth: "1985-10-12", gender: "female" } });
    expect(v("SK_RC", "450515123")).toMatchObject({ ok: true, data: { dateOfBirth: "1945-05-15", serial: "123" } });
  });

  test("rejections", () => {
    expect(v("SK_RC", "7103192746")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("SK_RC", withCheck("710230123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("SK_RC", "7113192745")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("SK_RC", "450515000")).toMatchObject({ ok: false, reason: "invalid_range" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SK_RC"),
      generate: (r) => {
        if (r() < 0.2) return fromTemplate("[0-4]#[05][1-9][0-2]#[1-9]##", r);
        const b = fromTemplate("[0-9]#[0-8]#[0-3]####", r);
        return r() < 0.6 ? withCheck(b) : b + fromTemplate("#", r);
      },
      samples: 20000,
      allow: (s, ours) => {
        const r = v("SK_RC", s);
        if (ours && s.length === 9) return "9-digit pre-1954 numbers accepted";
        if (ours && r.ok && r.data.extra.checkDigitException) return "pre-1985 remainder-10 numbers accepted";
        if (!ours && !r.ok && r.reason === "invalid_date") return "10-digit YY 00-53 is 20YY; future dates rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("SK_VAT", () => {
  test("valid and invalid", () => {
    expect(v("SK_VAT", "SK 2021234567")).toMatchObject({ ok: true, formatted: "SK 2021234567" });
    expect(v("SK_VAT", "2021234567")).toMatchObject({ ok: true });
    expect(v("SK_VAT", "SK2021234568")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("SK_VAT", "SK2051234567")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("SK_VAT", "SK0021234567")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SK_VAT"),
      generate: (r) => "SK" + withCheck(fromTemplate("[0-9]#[1-9]######", r)),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
