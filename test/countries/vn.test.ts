import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/vn.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("VN_CCCD", () => {
  test("extracts birth year, gender, province", () => {
    expect(validateDocument("VN_CCCD", "001 089 000 123")).toMatchObject({
      ok: true,
      normalized: "001089000123",
      data: { birthYear: 1989, gender: "male", citizenship: "citizen", region: "001", regionName: "Hà Nội", serial: "000123" },
    });
    expect(validateDocument("VN_CCCD", "079305123456")).toMatchObject({
      ok: true,
      data: { birthYear: 2005, gender: "female", region: "079", regionName: "Hồ Chí Minh" },
    });
    // unknown code (e.g. a country code for births abroad): accepted, no name
    const r = validateDocument("VN_CCCD", "300199123456");
    expect(r).toMatchObject({ ok: true, data: { region: "300", birthYear: 1999, gender: "female" } });
    expect(r.ok && r.data.regionName).toBeUndefined();
  });

  test("rejections", () => {
    expect(validateDocument("VN_CCCD", "001426000123")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2126
    expect(validateDocument("VN_CCCD", "001227000123")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2027
    expect(validateDocument("VN_CCCD", "001226000123")).toMatchObject({ ok: true, data: { birthYear: 2026 } });
    expect(validateDocument("VN_CCCD", "000089000123")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(validateDocument("VN_CCCD", "00108900012")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "VN_CCCD"),
      generate: (r) => fromTemplate("0[0-9]#[0-9]########", r),
      samples: 5000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const res = validateDocument("VN_CCCD", s);
        if (!res.ok && res.reason === "invalid_date") return "future birth year rejected";
        if (!res.ok && s.startsWith("000")) return "province code 000 rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("VN_CMND", () => {
  test("shape only", () => {
    expect(validateDocument("VN_CMND", "012345678")).toMatchObject({ ok: true, data: { citizenship: "citizen" } });
    expect(validateDocument("VN_CMND", "01234567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers on 9-digit numbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "VN_CMND"),
      generate: (r) => fromTemplate(r() < 0.8 ? "#########" : "########", r),
      samples: 2000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
