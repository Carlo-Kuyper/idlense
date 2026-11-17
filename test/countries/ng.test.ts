import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ng.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const NG = spec(documents, "NG_NIN");
describeContract(documents);

describe("NG_NIN", () => {
  test("shape only", () => {
    expect(check(NG, "123 4567 8901")).toMatchObject({ ok: true, normalized: "12345678901", data: { extra: {} } });
    expect(check(NG, "1234567890")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: NG,
      generate: (r) => fromTemplate(r() < 0.9 ? "###########" : "##########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
