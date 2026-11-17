import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/sm.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("San Marino", () => {
  test("shapes", () => {
    expect(v("SM_SSI", "123 456 789")).toMatchObject({ ok: true, normalized: "123456789" });
    expect(v("SM_SSI", "1234567890")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("SM_COE", "sm 12345")).toMatchObject({ ok: true, normalized: "SM12345", data: { serial: "12345" } });
    expect(v("SM_COE", "SA12345")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("SM_COE", "SM123456")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  // OECD sheet: leading digits may be omitted when they are zero
  test("omitted leading zeros are restored", () => {
    expect(v("SM_SSI", "12345678")).toMatchObject({ ok: true, normalized: "012345678", formatted: "012345678" });
    expect(v("SM_SSI", "4567")).toMatchObject({ ok: true, normalized: "000004567" });
    expect(v("SM_SSI", "000004567")).toMatchObject({ ok: true, normalized: "000004567" });
    expect(v("SM_COE", "SM123")).toMatchObject({ ok: true, normalized: "SM00123", data: { serial: "00123" } });
    expect(v("SM_COE", "sm 1")).toMatchObject({ ok: true, normalized: "SM00001", data: { serial: "00001" } });
    expect(v("SM_COE", "SM")).toMatchObject({ ok: false, reason: "invalid_length" });
    // the sheet's format is "more than one digit"; all-zero stubs aren't padded
    expect(v("SM_SSI", "7")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("SM_SSI", "000")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("SM_COE", "SM000")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test.each([
    ["SM_SSI", "#########", "#####"],
    ["SM_COE", "SM#####", "SA#####"],
  ])("%s agrees with idnumbers", (code, tpl, noise) => {
    const res = compareWithOracle({
      spec: spec(documents, code),
      generate: (r) => (r() < 0.8 ? fromTemplate(tpl, r) : fromTemplate(noise, r)),
      allow: (s, ours) => (ours && s.length < 9 ? "leading zeros may be omitted (OECD sheet); padded to 9 digits" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
