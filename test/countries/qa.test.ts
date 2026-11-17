import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/qa.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const QA = spec(documents, "QA_QID");
describeContract(documents);

describe("QA_QID", () => {
  test("extracts year, nationality and status", () => {
    expect(check(QA, "284 634 00123")).toMatchObject({
      ok: true,
      normalized: "28463400123",
      formatted: "284 634 00123",
      data: { birthYear: 1984, citizenship: "citizen", serial: "00123", extra: { nationalityCode: "634" } },
    });
    expect(check(QA, "30525012345")).toMatchObject({
      ok: true,
      data: { birthYear: 2005, citizenship: "resident", extra: { nationalityCode: "250" } },
    });
    expect(check(QA, "32635612345")).toMatchObject({ ok: true, data: { birthYear: 2026 } });
  });

  test("rejections", () => {
    expect(check(QA, "32735612345")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(QA, "28400012345")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(QA, "28463400000")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(QA, "18463400123")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(QA, "2846340012")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with personal-identity-validation except births in the current year", () => {
    const res = compareWithOracle({
      spec: QA,
      generate: (r) => {
        const nat = r() < 0.5 ? "634" : fromTemplate("[0-8]##", r);
        const yy = r() < 0.1 ? "26" : fromTemplate("##", r);
        const serial = r() < 0.05 ? "00000" : fromTemplate("#####", r);
        return fromTemplate("[1-3]", r) + yy + nat + serial;
      },
      allow: (s, ours) =>
        ours && s[0] === "3" && 2000 + Number(s.slice(1, 3)) === REF.getFullYear()
          ? "born in the reference year accepted"
          : undefined,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(res.explained).toHaveProperty("born in the reference year accepted");
  });
});
