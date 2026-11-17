import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bh.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const BH = spec(documents, "BH_CPR");
describeContract(documents);

describe("BH_CPR", () => {
  test("extracts birth year and month", () => {
    expect(check(BH, "800101001")).toMatchObject({ ok: true, data: { birthYear: 1980, serial: "0100", extra: { birthMonth: 1 } } });
    expect(check(BH, "120615432")).toMatchObject({ ok: true, data: { birthYear: 2012, extra: { birthMonth: 6 } } });
  });

  test("century", () => {
    expect(check(BH, "261100001")).toMatchObject({ data: { birthYear: 2026 } });
    expect(check(BH, "261200001")).toMatchObject({ data: { birthYear: 1926 } });
  });

  test("rejections", () => {
    expect(check(BH, "801301001")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(BH, "800001001")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(BH, "80010100")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: BH,
      generate: (r) => fromTemplate("##[01]######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
