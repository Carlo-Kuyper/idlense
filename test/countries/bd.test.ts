import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bd.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("BD_NID", () => {
  test("13-digit", () => {
    expect(v("BD_NID", "1592824588424")).toMatchObject({
      ok: true,
      data: { region: "15", serial: "588424", extra: { areaType: "city_corporation", policeStation: "28", union: "24" } },
    });
  });

  test("17-digit with birth year", () => {
    expect(v("BD_NID", "19841592824588424")).toMatchObject({ ok: true, data: { birthYear: 1984, region: "15", serial: "588424" } });
  });

  test("rejections", () => {
    expect(v("BD_NID", "1562824588424")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("BD_NID", "20301592824588424")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("BD_NID", "00001592824588424")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("BD_NID", "159282458842")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BD_NID"),
      generate: (r) => fromTemplate(r() < 0.5 ? "#############" : "[0-2]################", r),
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = v("BD_NID", s);
        return !r.ok && r.reason === "invalid_date" ? "implausible or future birth year rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BD_SMART_NID", () => {
  test("shape only", () => {
    expect(v("BD_SMART_NID", "123 456 7890")).toMatchObject({ ok: true, normalized: "1234567890" });
    expect(v("BD_SMART_NID", "123456789")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
