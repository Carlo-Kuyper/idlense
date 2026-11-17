import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/cd.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NN = spec(documents, "CD_NN");
const NIF = spec(documents, "CD_NIF");
describeContract(documents);

describe("CD_NN", () => {
  test("11 digits, separators ignored", () => {
    expect(check(NN, "123 4567 8901", REF)).toMatchObject({ ok: true, normalized: "12345678901", data: { extra: {} } });
  });

  test("rejections", () => {
    expect(check(NN, "1234567890", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NN, "123456789012", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("CD_NIF", () => {
  // Published sample: "A 0707219 F", the example in the DGI's VAT leaflet (via LookupTax).
  test("published sample", () => {
    expect(check(NIF, "A 0707219 F", REF)).toMatchObject({
      ok: true,
      normalized: "A0707219F",
      formatted: "A 0707219 F",
      data: { serial: "0707219" },
    });
    expect(check(NIF, "a0707219f", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(NIF, "10707219F", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIF, "A07072191", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIF, "A070721F", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
