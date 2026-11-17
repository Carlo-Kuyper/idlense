import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ht.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NIF = spec(documents, "HT_NIF");
const NINU = spec(documents, "HT_NINU");
const CIN = spec(documents, "HT_CIN");
describeContract(documents);

describe("HT_NIF / HT_NINU", () => {
  test("10 digits", () => {
    expect(check(NIF, "123-456-789-0", REF)).toMatchObject({ ok: true, normalized: "1234567890" });
    expect(check(NINU, "1234567890", REF)).toMatchObject({ ok: true });
  });

  test("rejections", () => {
    expect(check(NIF, "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NINU, "12345678901", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("HT_CIN", () => {
  test("first generation: department, commune, country, birth year and month", () => {
    expect(check(CIN, "01-05-99-1985-03-00123", REF)).toMatchObject({
      ok: true,
      normalized: "01059919850300123",
      formatted: "01-05-99-1985-03-00123",
      data: {
        birthYear: 1985,
        region: "01",
        regionName: "Ouest",
        serial: "00123",
        extra: { generation: 1, birthMonth: 3, commune: "05", countryCode: "99", countryName: "Haiti" },
      },
    });
    expect(check(CIN, "07-02-00-1970-12-54321", REF)).toMatchObject({
      ok: true,
      data: { regionName: "Sud", extra: { countryName: "Dominican Republic" } },
    });
  });

  test("unconfirmed department codes get no name", () => {
    const r = check(CIN, "03-01-99-1990-06-00001", REF);
    expect(r).toMatchObject({ ok: true, data: { region: "03" } });
    expect(r.data).not.toHaveProperty("regionName");
  });

  test("second generation: length only", () => {
    expect(check(CIN, "12345678901234", REF)).toMatchObject({ ok: true, data: { extra: { generation: 2 } } });
  });

  test("invalid_date: future birth month", () => {
    expect(check(CIN, "01-05-99-2026-12-00123", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("invalid_format: month 13", () => {
    expect(check(CIN, "01-05-99-1985-13-00123", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("invalid_length", () => {
    expect(check(CIN, "0105991985030012", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
