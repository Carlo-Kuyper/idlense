import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/hr.js";
import { jmbgCheck } from "../../src/countries/rs.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const OIB = spec(documents, "HR_OIB");
const JMBG = spec(documents, "HR_JMBG");
const withCheck = (first12: string) => first12 + jmbgCheck(first12).k;
describeContract(documents);

describe("HR_OIB", () => {
  test("valid, with VAT prefix and separators", () => {
    for (const s of ["12345678903", "HR12345678903", "hr 123 456 789 03"]) {
      expect(check(OIB, s), s).toMatchObject({ ok: true, normalized: "12345678903", data: {} });
    }
  });

  test("rejections", () => {
    expect(check(OIB, "12345678904")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(OIB, "1234567890")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(OIB, "1234567890A")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  const gen = (r: () => number) => fromTemplate("###########", r);

  test("agrees with nationid", () => {
    const res = compareWithOracle({ spec: OIB, generate: gen, samples: 20000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: OIB,
      generate: gen,
      samples: 20000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("HR_JMBG", () => {
  test("extracts everything", () => {
    expect(check(JMBG, "0101990330000")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1990-01-01",
        gender: "male",
        region: "33",
        regionName: "Zagreb",
        serial: "000",
        extra: { registerArea: "Croatia" },
      },
    });
    expect(check(JMBG, withCheck("150698538700"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1985-06-15", gender: "female", regionName: "Split, Zadar, Šibenik, Dubrovnik, Dalmatia" },
    });
    expect(check(JMBG, withCheck("010198503000"))).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
  });

  test("rejections", () => {
    expect(check(JMBG, withCheck("010199097000"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(JMBG, withCheck("310499033000"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(JMBG, "0101990330001")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
});
