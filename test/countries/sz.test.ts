import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/sz.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const PIN = spec(documents, "SZ_PIN");
const TIN = spec(documents, "SZ_TIN");
describeContract(documents);

const withCheck = (body: string) => body + luhnCheckDigit(body);

// The PIN layout and the Luhn check were derived from 18 PINs quoted in EswatiniLII judgments, e.g.
// https://eswatinilii.org/akn/sz/judgment/szhc/2021/134/eng@2021-08-20 and
// https://eswatinilii.org/akn/sz/judgment/szhc/2020/98/eng@2020-05-26. 17 pass Luhn. They belong
// to real people, so they aren't copied here; every number below is synthetic.
describe("SZ_PIN", () => {
  test("birth date, sex and serial", () => {
    expect(check(PIN, "8504236100122", REF)).toMatchObject({
      ok: true,
      formatted: "850423 6100122",
      data: {
        dateOfBirth: "1985-04-23",
        birthYear: 1985,
        gender: "male",
        serial: "0012",
        extra: { sexDigit: "6", eighthDigit: "1" },
      },
    });
    expect(check(PIN, "850423 1100341", REF)).toMatchObject({ ok: true, data: { gender: "female" } });
    expect(check(PIN, "0203151100013", REF)).toMatchObject({ ok: true, data: { birthYear: 2002, gender: "female" } });
  });

  test("sex digits other than 1 and 6 are kept raw, not mapped", () => {
    const id = withCheck("850423310012");
    const r = check(PIN, id, REF);
    expect(r).toMatchObject({ ok: true, data: { extra: { sexDigit: "3" } } });
    expect(r.ok && r.data.gender).toBeUndefined();
  });

  test("rejections", () => {
    expect(check(PIN, "8504236100123", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(PIN, withCheck("850229610012"), REF)).toMatchObject({ ok: false, reason: "invalid_date" }); // 29 Feb 1985
    expect(check(PIN, withCheck("851323610012"), REF)).toMatchObject({ ok: false, reason: "invalid_format" }); // month 13
    expect(check(PIN, "850423610012", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(PIN, "85042361001220", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("SZ_TIN", () => {
  test("9 digits starting with 1", () => {
    expect(check(TIN, "123 456 789", REF)).toMatchObject({ ok: true, normalized: "123456789" });
  });

  test("rejections", () => {
    expect(check(TIN, "223456789", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "12345678", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
