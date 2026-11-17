import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/my.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const MY = spec(documents, "MY_NRIC");
describeContract(documents);

describe("MY_NRIC", () => {
  test("extracts everything", () => {
    expect(check(MY, "800101-14-5013")).toMatchObject({
      ok: true,
      normalized: "800101145013",
      formatted: "800101-14-5013",
      data: {
        dateOfBirth: "1980-01-01",
        birthYear: 1980,
        gender: "male",
        region: "14",
        regionName: "Kuala Lumpur",
        serial: "5013",
        extra: { bornAbroad: false },
      },
    });
  });

  test("gender, foreign birthplace and secondary state codes", () => {
    expect(check(MY, "050315660102")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2005-03-15", gender: "female", region: "66", regionName: "Singapore", extra: { bornAbroad: true } },
    });
    expect(check(MY, "900101515013")).toMatchObject({ ok: true, data: { regionName: "Sarawak" } });
    expect(check(MY, "900101825013")).toMatchObject({ ok: true, data: { regionName: "Unknown state", extra: { bornAbroad: false } } });
  });

  test("century", () => {
    // serial 5-9 → 19YY even when 20YY would be in the past
    expect(check(MY, "100101105011")).toMatchObject({ data: { dateOfBirth: "1910-01-01" } });
    expect(check(MY, "100101100011")).toMatchObject({ data: { dateOfBirth: "2010-01-01" } });
    // serial 0-4 but 20YY in the future → 19YY (upstream says 2080)
    expect(check(MY, "800101011234")).toMatchObject({ data: { dateOfBirth: "1980-01-01" } });
    expect(check(MY, "261117101234")).toMatchObject({ data: { dateOfBirth: "1926-11-17" } });
    expect(check(MY, "000229100011")).toMatchObject({ data: { dateOfBirth: "2000-02-29" } });
    expect(check(MY, "000229105011")).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("rejections", () => {
    for (const pb of ["00", "17", "20", "69", "70", "73", "80", "81", "94", "97"]) {
      expect(check(MY, `800101${pb}5013`), pb).toMatchObject({ ok: false, reason: "invalid_range" });
    }
    expect(check(MY, "800230145013")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(MY, "801301145013")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(MY, "80010114501")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: MY,
      generate: (r) => fromTemplate("##[01]#[0-3]#[0-9]#####", r),
      samples: 20000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
