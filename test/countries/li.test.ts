import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/li.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const PEID = spec(documents, "LI_PEID");
describeContract(documents);

describe("LI_PEID", () => {
  test("up to 12 digits, leading zeros dropped", () => {
    // OECD sheet: format 999999999999; may be only seven or four digits long.
    expect(check(PEID, "999999999999", REF)).toMatchObject({ ok: true });
    expect(check(PEID, "1234567", REF)).toMatchObject({ ok: true });
    expect(check(PEID, "1234", REF)).toMatchObject({ ok: true });
  });

  test("rejections", () => {
    expect(check(PEID, "0123456", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(PEID, "1234567890123", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
