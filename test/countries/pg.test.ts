import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/pg.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const PG = spec(documents, "PG_NID");
describeContract(documents);

describe("PG_NID", () => {
  test("shape only", () => {
    expect(check(PG, "1234 567 890", REF)).toMatchObject({ ok: true, normalized: "1234567890", data: { extra: {} } });
    expect(check(PG, "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: PG,
      generate: (r) => fromTemplate("##########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
