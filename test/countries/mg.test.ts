import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/mg.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const CIN = spec(documents, "MG_CIN");
const NIF = spec(documents, "MG_NIF");
describeContract(documents);

describe("MG_CIN", () => {
  test("extracts district, commune, sex digit and serial", () => {
    expect(check(CIN, "101 011 123 456", REF)).toMatchObject({
      ok: true,
      normalized: "101011123456",
      formatted: "101 011 123 456",
      data: { region: "101", serial: "123456", extra: { communeCode: "01", sexDigit: "1" } },
    });
    expect(check(CIN, "201022654321", REF)).toMatchObject({ ok: true, data: { region: "201", extra: { communeCode: "02", sexDigit: "2" } } });
  });

  test("no gender is inferred (sex digit values unsourced)", () => {
    const r = check(CIN, "101011123456", REF);
    expect(r.ok && r.data.gender).toBeFalsy();
  });

  test("rejections", () => {
    expect(check(CIN, "10101112345", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(CIN, "1010111234567", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("MG_NIF", () => {
  // Published sample: 4001257310, the example in org-id.guide's MG-NIF registry entry.
  test("published sample", () => {
    expect(check(NIF, "4001257310", REF)).toMatchObject({ ok: true, data: { serial: "00125731" } });
  });

  test("rejections", () => {
    expect(check(NIF, "400125731", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NIF, "40012573100", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
