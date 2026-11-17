import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/iq.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const IQ = spec(documents, "IQ_NID");
describeContract(documents);

describe("IQ_NID", () => {
  test("shape only", () => {
    expect(check(IQ, "1990 1234 5678")).toMatchObject({ ok: true, normalized: "199012345678", formatted: "1990 1234 5678" });
    expect(check(IQ, "19901234567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: IQ,
      generate: (r) => fromTemplate(r() < 0.9 ? "############" : "###########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
