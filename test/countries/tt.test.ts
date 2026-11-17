import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/tt.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const BIR = spec(documents, "TT_BIR");
describeContract(documents);

describe("TT_BIR", () => {
  test("shape", () => {
    expect(check(BIR, "123456789-0", REF)).toMatchObject({ ok: true, normalized: "1234567890" });
    expect(check(BIR, "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
