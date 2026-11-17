import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/zm.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const ZM = spec(documents, "ZM_NRC");
describeContract(documents);

describe("ZM_NRC", () => {
  test("extracts district, serial and nationality", () => {
    expect(check(ZM, "123456/11/1", REF)).toMatchObject({
      ok: true,
      formatted: "123456/11/1",
      data: { citizenship: "citizen", region: "11", serial: "123456", extra: { provinceDigit: "1" } },
    });
    expect(check(ZM, "123456/61/2", REF)).toMatchObject({ ok: true, data: { citizenship: "commonwealth_citizen", region: "61" } });
    expect(check(ZM, "123456 82 3", REF)).toMatchObject({ ok: true, data: { citizenship: "foreigner", region: "82" } });
  });

  // Published samples: 000001/11/1 (first card ever, Zambian Observer), 479974/11/1 (same paper),
  // and the 123456/78/9 placeholder in the Dojah API docs. The placeholder's nationality digit 9
  // isn't one of the documented codes, so it is rejected.
  test("published samples", () => {
    expect(check(ZM, "000001/11/1", REF)).toMatchObject({ ok: true, data: { serial: "000001", region: "11" } });
    expect(check(ZM, "479974/11/1", REF)).toMatchObject({ ok: true, data: { citizenship: "citizen" } });
    expect(check(ZM, "123456/78/9", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("rejections", () => {
    expect(check(ZM, "000000/11/1", REF)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(ZM, "123456/11/0", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ZM, "123456/11/4", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ZM, "12345/11/1", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
