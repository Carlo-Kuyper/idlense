import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/dz.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NIN = spec(documents, "DZ_NIN");
const NIF = spec(documents, "DZ_NIF");
describeContract(documents);

describe("DZ_NIN", () => {
  test("splits the published segments", () => {
    expect(check(NIN, "10 985 0160 01234 01 45", REF)).toMatchObject({
      ok: true,
      normalized: "109850160012340145",
      data: {
        region: "0160",
        serial: "01234",
        extra: { statusCode: "10", registrationYearDigits: "985", registerSeries: "01", controlKey: "45" },
      },
    });
  });

  test("rejections", () => {
    expect(check(NIN, "10985016001234014", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NIN, "1098501600123401456", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("DZ_NIF", () => {
  // Published samples (python-stdnum docs, origin unknown): 416001000000007, 408020000150039,
  // 41201600000606600001, 00021600180833713010.
  test("published samples", () => {
    expect(check(NIF, "416001000000007", REF)).toMatchObject({ ok: true, data: { extra: { secondaryEstablishment: false } } });
    expect(check(NIF, "408020000150039", REF).ok).toBe(true);
    expect(check(NIF, "41201600000606600001", REF)).toMatchObject({ ok: true, data: { extra: { secondaryEstablishment: true } } });
    expect(check(NIF, "00021600180833713010", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(NIF, "41600100000000", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NIF, "4160010000000071", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
