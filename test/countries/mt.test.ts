import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/mt.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

describe("MT_ID", () => {
  test("letters", () => {
    expect(v("MT_ID", "12345M")).toMatchObject({
      ok: true,
      normalized: "0012345M",
      data: { region: "Malta", serial: "00123", extra: { registrationYear: 1945 } },
    });
    expect(v("MT_ID", "1234510g")).toMatchObject({ ok: true, data: { region: "Gozo", extra: { registrationYear: 1910 } } });
    expect(v("MT_ID", "0012320L")).toMatchObject({ ok: true, data: { extra: { registrationYear: 2020 } } });
    expect(v("MT_ID", "0012389B")).toMatchObject({ ok: true, data: { extra: { registrationYear: 1889 } } });
    expect(v("MT_ID", "1234567A")).toMatchObject({ ok: true, data: { citizenship: "foreigner", extra: {} } });
  });

  test("rejections", () => {
    expect(v("MT_ID", "0012399L")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2099
    expect(v("MT_ID", "0012345Q")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("MT_ID", "123456789M")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("MT_VAT", () => {
  test("valid and invalid", () => {
    expect(v("MT_VAT", "MT 1167 9112")).toMatchObject({ ok: true, normalized: "MT11679112", formatted: "MT 11679112" });
    expect(v("MT_VAT", "MT11679113")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "MT_VAT"),
      generate: (r) => fromTemplate("MT######", r) + String(Math.floor(r() * 37)).padStart(2, "0"),
      samples: 20000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
