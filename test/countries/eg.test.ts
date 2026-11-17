import { describe, expect, test } from "vitest";
import { documents, EG_GOVERNORATES } from "../../src/countries/eg.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const EG = spec(documents, "EG_NID");
describeContract(documents);

describe("EG_NID", () => {
  test("extracts everything", () => {
    expect(check(EG, "29001010100017")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1990-01-01",
        birthYear: 1990,
        gender: "male",
        region: "01",
        regionName: "Cairo",
        serial: "0001",
        extra: { bornAbroad: false },
      },
    });
    expect(check(EG, "30502288800027")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "2005-02-28",
        gender: "female",
        region: "88",
        regionName: "Born outside Egypt",
        extra: { bornAbroad: true },
      },
    });
  });

  test("dates", () => {
    expect(check(EG, "30002290100017")).toMatchObject({ ok: true, data: { dateOfBirth: "2000-02-29" } });
    expect(check(EG, "20002290100017")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(EG, "32611160100017")).toMatchObject({ ok: true });
    expect(check(EG, "32611170100017")).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("rejections", () => {
    expect(check(EG, "29001010500017")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(EG, "29001014100017")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(EG, "19001010100017")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(EG, "2900101010001")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except future birth dates", () => {
    const govs = Object.keys(EG_GOVERNORATES);
    const res = compareWithOracle({
      spec: EG,
      generate: (r) => {
        const gov = r() < 0.8 ? govs[Math.floor(r() * govs.length)]! : fromTemplate("##", r);
        return fromTemplate("[1-3]#[0-9][01]#[0-3]#", r) + gov + fromTemplate("#####", r);
      },
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = check(EG, s);
        return !r.ok && r.reason === "invalid_date"
          ? "future birth date rejected"
          : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(res.explained).toHaveProperty("future birth date rejected");
  });
});
