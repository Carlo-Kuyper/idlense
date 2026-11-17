import { describe, expect, test } from "vitest";
import { documents, snilsCheck } from "../../src/countries/ru.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("RU_INN", () => {
  test("individual", () => {
    expect(v("RU_INN", "770112345695")).toMatchObject({
      ok: true,
      data: { region: "77", serial: "123456", extra: { taxOffice: "7701" } },
    });
    expect(v("RU_INN", "770112345696")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("RU_INN", "770112345605")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("RU_INN", "000112345695")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("RU_INN", "7700123459")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("organisation", () => {
    expect(v("RU_INN_ORG", "7700123459")).toMatchObject({
      ok: true,
      data: { region: "77", serial: "12345", extra: { taxOffice: "7700", foreignOrganisation: false } },
    });
    expect(v("RU_INN_ORG", "7700123458")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // a published company INN (Sberbank)
    expect(v("RU_INN_ORG", "7707083893")).toMatchObject({ ok: true });
  });
});

describe("RU_SNILS", () => {
  test("check number", () => {
    expect(v("RU_SNILS", "123-456-789 64")).toMatchObject({
      ok: true,
      normalized: "12345678964",
      formatted: "123-456-789 64",
      data: { serial: "123456789", extra: { checkNumberVerified: true } },
    });
    expect(v("RU_SNILS", "12345678965")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // sums of 100 and 101 give 00
    expect(snilsCheck("900000601")).toBe(0);
    expect(snilsCheck("900000602")).toBe(0);
    expect(snilsCheck("999999999")).toBe(1);
    expect(snilsCheck("100000001")).toBe(10);
    // early numbers carry no check number
    expect(v("RU_SNILS", "00100199812")).toMatchObject({ ok: true, data: { extra: { checkNumberVerified: false } } });
    expect(v("RU_SNILS", "00000000000")).toMatchObject({ ok: false, reason: "invalid_range" });
  });
});

describe("RU_PASSPORT", () => {
  test("shape", () => {
    expect(v("RU_PASSPORT", "45 09 123456")).toMatchObject({
      ok: true,
      formatted: "45 09 123456",
      data: { region: "45", serial: "123456", extra: { series: "4509", blankYear: "09" } },
    });
    expect(v("RU_PASSPORT", "0000123456")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("RU_PASSPORT", "4509000000")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "RU_PASSPORT"),
      generate: (r) => (r() < 0.2 ? fromTemplate("0000######", r) : r() < 0.2 ? fromTemplate("####000000", r) : fromTemplate("##########", r)),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
