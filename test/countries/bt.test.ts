import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bt.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const CID = spec(documents, "BT_CID");

describe("BT_CID", () => {
  test("segments", () => {
    expect(check(CID, "114 10 012345")).toMatchObject({
      ok: true,
      normalized: "11410012345",
      data: { region: "14", serial: "012345", extra: { censusCategory: "1", gewog: "10" } },
    });
  });

  test("rejections", () => {
    expect(check(CID, "1141001234")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(CID, "114100123456")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
