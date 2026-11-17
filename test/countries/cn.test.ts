import { describe, expect, test } from "vitest";
import { mod11_2Check } from "../../src/core/algorithms.js";
import { documents, usccCheckChar } from "../../src/countries/cn.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const ric = (body17: string) => body17 + mod11_2Check(body17);
describeContract(documents);

describe("CN_RIC", () => {
  test("extracts everything", () => {
    expect(v("CN_RIC", "11010519491231002X")).toMatchObject({
      ok: true,
      formatted: "110105 19491231 002X",
      data: {
        dateOfBirth: "1949-12-31",
        birthYear: 1949,
        gender: "female",
        region: "110105",
        regionName: "Beijing",
        serial: "002",
        extra: {},
      },
    });
    expect(v("CN_RIC", ric("44030620120229001"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2012-02-29", gender: "male", regionName: "Guangdong" },
    });
    expect(v("CN_RIC", "11010519491231002x").ok).toBe(true);
  });

  test("HK/MO/TW residence permits", () => {
    expect(v("CN_RIC", ric("81000019900101001"))).toMatchObject({
      ok: true,
      data: { regionName: "Hong Kong", extra: { kind: "hk-mo-tw-residence-permit" } },
    });
    expect(v("CN_RIC", ric("83000019900101002"))).toMatchObject({ ok: true, data: { regionName: "Taiwan", gender: "female" } });
  });

  test("rejections", () => {
    expect(v("CN_RIC", "110105194912310021")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("CN_RIC", ric("99010519491231002"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("CN_RIC", ric("19010519491231002"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("CN_RIC", ric("11010519490229002"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("CN_RIC", ric("11010520301231002"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("CN_RIC", ric("11010517001231002"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("CN_RIC", "11010519491231002")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CN_RIC"),
      generate: (r) => fromTemplate("[1-8]#####[12][09]##[01]#[0-3]####[0-9X]", r),
      samples: 30000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const res = v("CN_RIC", s);
        if (res.ok) return undefined;
        if (res.reason === "invalid_range") return "unknown province code rejected";
        if (res.reason === "invalid_date") return "future birth date rejected";
        const y = Number(s.slice(6, 10));
        if (res.reason === "invalid_format" && (y < 1800 || y > 2099)) return "birth year outside 1800-2099 rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("CN_RIC15", () => {
  test("legacy 15-digit number", () => {
    expect(v("CN_RIC15", "110105491231002")).toMatchObject({
      ok: true,
      formatted: "110105 491231 002",
      data: { dateOfBirth: "1949-12-31", gender: "female", regionName: "Beijing", serial: "002" },
    });
    expect(v("CN_RIC15", "440306800101003")).toMatchObject({ ok: true, data: { dateOfBirth: "1980-01-01", gender: "male" } });
    expect(v("CN_RIC15", "110105490229002")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("CN_RIC15", "190105491231002")).toMatchObject({ ok: false, reason: "invalid_range" });
  });
});

describe("CN_FPRID", () => {
  test("2023 foreigner's permanent residence card", () => {
    expect(v("CN_FPRID", "911124197506010016")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1975-06-01",
        gender: "male",
        citizenship: "permanent_resident",
        region: "11",
        regionName: "Beijing",
        serial: "001",
        extra: { nationality: "124" },
      },
    });
    expect(v("CN_FPRID", "911124197506010017")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    const body = "91912419750601001";
    expect(v("CN_FPRID", body + mod11_2Check(body))).toMatchObject({ ok: false, reason: "invalid_range" });
  });
});

describe("CN_USCC", () => {
  test("GB 32100-2015 example", () => {
    expect(v("CN_USCC", "91350100M000100Y43")).toMatchObject({
      ok: true,
      data: {
        region: "350100",
        regionName: "Fujian",
        extra: { registrationAuthority: "9", entityType: "1", organizationCode: "M000100Y4" },
      },
    });
    expect(v("CN_USCC", "91350100M000100Y44")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // I, O, S, V, Z are not in the alphabet.
    expect(v("CN_USCC", "91350100M000100I43")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(usccCheckChar("91350100M000100Y4")).toBe("3");
  });
});
