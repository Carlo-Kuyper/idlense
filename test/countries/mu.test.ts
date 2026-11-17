import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/mu.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const MU = spec(documents, "MU_NIC");
describeContract(documents);

describe("MU_NIC", () => {
  test("extracts date of birth, sequence and surname initial", () => {
    expect(check(MU, "A0101800000017", REF)).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, serial: "000001", extra: { surnameInitial: "A" } },
    });
    expect(check(MU, "b 150615 123456 X", REF)).toMatchObject({
      ok: true,
      normalized: "B150615123456X",
      data: { dateOfBirth: "2015-06-15" },
    });
  });

  test("century", () => {
    expect(check(MU, "A1611260000017", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "2026-11-16" } });
    expect(check(MU, "A1711260000017", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "1926-11-17" } });
  });

  /**
   * Published samples:
   * - J2906201304089: valid in DataPrep's clean_mu_nid docs, which give its birth date as 2020-06-29.
   * - M2206357474780: from the python-stdnum mailing list (2018/msg00007); the MRA online check
   *   accepted it with a final 0.
   */
  test("published samples", () => {
    expect(check(MU, "J2906201304089", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "2020-06-29" } });
    expect(check(MU, "M2206357474780", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "1935-06-22" } });
    expect(check(MU, "7542011030", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("rejections", () => {
    expect(check(MU, "A3002800000017", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(MU, "A0113800000017", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(MU, "10101800000017", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(MU, "A010180000001", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
