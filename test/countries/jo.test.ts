import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/jo.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const JO = spec(documents, "JO_NN");
describeContract(documents);

/** personal-identity-validation ValidatorJOR. */
const PIV_JOR = /^[1-2]\d(0[1-9]|[1-9][0-2])\d{4}\d{2}$/;

describe("JO_NN", () => {
  test("shape only", () => {
    expect(check(JO, "9861012345")).toMatchObject({ ok: true, data: { extra: {} } });
    expect(check(JO, "2000123456").ok).toBe(true);
    expect(check(JO, "986101234")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(JO, "98610123AB")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with personal-identity-validation except its unsourced prefix/month rule", () => {
    const res = compareWithOracle({
      spec: JO,
      generate: (r) => fromTemplate(r() < 0.9 ? "##########" : "#########", r),
      allow: (s, ours) => (ours && s.length === 10 && !PIV_JOR.test(s) ? "first digit 1-2 / month-like digits 3-4 not required" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
