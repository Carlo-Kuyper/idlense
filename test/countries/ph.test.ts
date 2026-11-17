import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ph.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const PSN = spec(documents, "PH_PSN");
const PCN = spec(documents, "PH_PCN");
describeContract(documents);

describe("Philippines", () => {
  test("PSN", () => {
    expect(check(PSN, "1234-5678901-2")).toMatchObject({ ok: true, normalized: "123456789012", formatted: "1234-5678901-2" });
    expect(check(PSN, "12345678901")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("PCN", () => {
    expect(check(PCN, "1234 5678 9012 3456")).toMatchObject({ ok: true, formatted: "1234-5678-9012-3456", data: { extra: {} } });
    expect(check(PCN, "123456789012345")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers (PSN)", () => {
    const res = compareWithOracle({
      spec: PSN,
      generate: (r) => fromTemplate(r() < 0.8 ? "####-#######-#" : "###########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
