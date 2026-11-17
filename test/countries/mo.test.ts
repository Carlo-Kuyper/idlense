import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/mo.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const MO = spec(documents, "MO_BIR");
const v = (s: string) => check(MO, s, REF);
describeContract(documents);

describe("MO_BIR", () => {
  test("shape and extraction", () => {
    expect(v("5215432(8)")).toMatchObject({
      ok: true,
      normalized: "52154328",
      formatted: "5215432(8)",
      data: { serial: "215432", extra: { series: "5", controlDigit: "8" } },
    });
    expect(v("1/234567/0").ok).toBe(true);
    expect(v("32154328")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("5215432")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: MO,
      generate: (r) => fromTemplate("########", r),
      samples: 3000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
