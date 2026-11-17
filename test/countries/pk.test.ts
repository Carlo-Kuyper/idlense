import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/pk.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const PK = spec(documents, "PK_CNIC");
const v = (s: string) => check(PK, s, REF);
describeContract(documents);

describe("PK_CNIC", () => {
  test("extracts province, gender and serial", () => {
    expect(v("35202-1234567-1")).toMatchObject({
      ok: true,
      formatted: "35202-1234567-1",
      data: { gender: "male", region: "3", regionName: "Punjab", serial: "1234567", extra: { locality: "35202" } },
    });
    expect(v("4210112345678")).toMatchObject({ ok: true, data: { gender: "female", regionName: "Sindh" } });
    expect(v("6110112345670")).toMatchObject({ ok: true, data: { gender: "female", regionName: "Islamabad Capital Territory" } });
  });

  test("rejections", () => {
    expect(v("0520212345671")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("9520212345671")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("352021234567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: PK,
      generate: (r) => fromTemplate("#############", r),
      allow: (s, ours) => (!ours && /^[09]/.test(s) ? "leading 0/9 is not a province code" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
