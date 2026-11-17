import { describe, expect, test } from "vitest";
import { documents, tjInnCheckDigit } from "../../src/countries/tj.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const INN = spec(documents, "TJ_INN");

describe("TJ_INN", () => {
  // Registered suppliers in the official e-procurement register (eprocurement.gov.tj).
  test("published organisation numbers", () => {
    expect(check(INN, "640001675").ok).toBe(true); // military unit 08030, Ministry of Defence
    expect(check(INN, "040052973").ok).toBe(true); // ООО «Алинур 2017»
    expect(check(INN, "010011817").ok).toBe(true); // ООО «Восток»
  });

  test("worked check digit", () => {
    // 6·10 + 4·7 + 0·5 + 0·10 + 0·4 + 1·3 + 6·8 + 7·6 = 181 ≡ 5 (mod 11)
    expect(tjInnCheckDigit("64000167")).toBe(5);
  });

  test("remainder 10 gives 5", () => {
    const body = "10000000"; // 10 ≡ 10 (mod 11)
    expect(tjInnCheckDigit(body)).toBe(5);
    expect(check(INN, body + "5").ok).toBe(true);
    expect(check(INN, body + "0")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("rejections", () => {
    expect(check(INN, "640001676")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(INN, "64000167")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
