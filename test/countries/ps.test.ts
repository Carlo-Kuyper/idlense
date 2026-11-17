import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/ps.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const PS = spec(documents, "PS_ID");
describeContract(documents);

describe("PS_ID", () => {
  test("valid numbers", () => {
    expect(check(PS, "400000006")).toMatchObject({ ok: true, formatted: "40000000-6", data: { extra: {} } });
    expect(check(PS, "9012 3456 7").ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(PS, "400000007")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(PS, "012345674")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(PS, "40000000")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with personal-identity-validation", () => {
    const res = compareWithOracle({
      spec: PS,
      generate: (r) => {
        const body = fromTemplate("########", r);
        return r() < 0.5 ? body + luhnCheckDigit(body) : fromTemplate("#########", r);
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
