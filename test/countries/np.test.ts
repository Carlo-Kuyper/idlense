import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/np.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const NP = spec(documents, "NP_NIN");
describeContract(documents);

describe("NP_NIN", () => {
  test("shape", () => {
    expect(check(NP, "123-456-7890", REF)).toMatchObject({ ok: true, normalized: "1234567890", data: { extra: {} } });
    expect(check(NP, "12345678901", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except the length fix", () => {
    const res = compareWithOracle({
      spec: NP,
      generate: (r) => fromTemplate(r() < 0.5 ? "##########" : "###########", r),
      allow: (s, ours) => {
        if (ours && s.length === 10) return "NIN is 10 digits";
        if (!ours && s.length === 11) return "11 digits (upstream copied Nigeria's NIN length)";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
