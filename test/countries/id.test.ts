import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/id.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

/** The 7,030 district codes idnumbers 2.3.0 accepts, saved when it was removed as a dev dependency. */
const UPSTREAM_DISTRICTS = new Set<string>(
  JSON.parse(readFileSync(new URL("../fixtures/upstream/idnumbers-idn-districts.json", import.meta.url), "utf8")),
);

const NIK = spec(documents, "ID_NIK");
const NPWP = spec(documents, "ID_NPWP");
describeContract(documents);

describe("ID_NIK", () => {
  test("extracts everything", () => {
    expect(check(NIK, "3174 0541 0190 0001")).toMatchObject({
      ok: true,
      formatted: "317405 410190 0001",
      data: {
        dateOfBirth: "1990-01-01",
        birthYear: 1990,
        gender: "female",
        region: "31",
        regionName: "DKI Jakarta",
        serial: "0001",
        extra: { regency: "3174", district: "317405" },
      },
    });
    expect(check(NIK, "3273241708900002")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1990-08-17", gender: "male", regionName: "Jawa Barat" },
    });
    // new Papua province (2022)
    expect(check(NIK, "9301015505150003")).toMatchObject({ ok: true, data: { regionName: "Papua Selatan", dateOfBirth: "2015-05-15" } });
  });

  test("century", () => {
    expect(check(NIK, "3174051611260001")).toMatchObject({ data: { dateOfBirth: "2026-11-16" } });
    expect(check(NIK, "3174051711260001")).toMatchObject({ data: { dateOfBirth: "1926-11-17" } });
    expect(check(NIK, "3174052902000001")).toMatchObject({ data: { dateOfBirth: "2000-02-29" } });
  });

  test("rejections", () => {
    expect(check(NIK, "2074054101900001")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(NIK, "3100054101900001")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIK, "3174054101900000")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIK, "3174053501900001")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIK, "3174053102900001")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(NIK, "3174057102900001")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(NIK, "317405410190001")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const DISTRICTS = ["317405", "327324", "110101", "350101", "510101", "730101", "910101", "647101"];

  test("agrees with idnumbers except districts missing from its snapshot", () => {
    const res = compareWithOracle({
      spec: NIK,
      generate: (r) =>
        (r() < 0.6 ? DISTRICTS[Math.floor(r() * DISTRICTS.length)] : fromTemplate("[1-9]#####", r)) +
        fromTemplate("[0-7]#[01]#######", r),
      samples: 20000,
      allow: (s, ours) =>
        ours && !UPSTREAM_DISTRICTS.has(s.slice(0, 6)) ? "district code not in upstream's snapshot" : undefined,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("ID_NPWP", () => {
  test("legacy 15-digit and 16-digit forms", () => {
    expect(check(NPWP, "09.123.456.7-012.000")).toMatchObject({
      ok: true,
      normalized: "091234567012000",
      formatted: "09.123.456.7-012.000",
      data: { serial: "123456", extra: { taxpayerType: "09", taxOffice: "012", branch: "000", sixteenDigit: false } },
    });
    expect(check(NPWP, "0091234567012000")).toMatchObject({ ok: true, data: { serial: "123456", extra: { sixteenDigit: true } } });
    // A 16-digit NPWP not starting with 0 is a NIK (use ID_NIK)
    expect(check(NPWP, "3174054101900001")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NPWP, "0912345670120")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
