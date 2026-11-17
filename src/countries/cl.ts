/**
 * Chile — RUN/RUT and passport.
 *
 * - RUN (Rol Único Nacional, Registro Civil) and RUT (Rol Único Tributario,
 *   SII) share one number space: people's RUN is their RUT, companies get a
 *   RUT from SII. 7-8 digit body + check character: mod 11 with weights
 *   2,3,4,5,6,7 repeating from the right; 11 → 0, 10 → K.
 * - Passport: since 2013 independent of the RUN, 8-9 alphanumerics, no check
 *   digit on the printed number.
 *
 * Improves on upstream:
 * - idnumbers applies fixed weights 3,2,7,6,5,4,3,2 from the left, which is
 *   only right for 8-digit bodies: every 7-digit RUN (< 10,000,000) gets the
 *   wrong check digit. We weight from the right.
 * - idnumbers accepts a lowercase `k` in its pattern but then compares it to
 *   `K`, so `12.345.678-k` style input fails; we uppercase.
 * - nationid accepts 1-6 digit bodies (e.g. `1-9`), which match far too much
 *   when guessing; we require the 7-8 digit bodies people and companies hold.
 */
import { cyclicWeightsFromRight, weightedSum } from "../core/algorithms.js";
import { compact } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export function rutCheck(body: string): string {
  const dv = 11 - (weightedSum(body, cyclicWeightsFromRight(body.length)) % 11);
  return dv === 11 ? "0" : dv === 10 ? "K" : String(dv);
}

export function formatRut(c: string): string {
  const body = c.slice(0, -1).replace(/\B(?=(\d{3})+$)/g, ".");
  return `${body}-${c.slice(-1)}`;
}

export const documents: DocumentSpec[] = [
  {
    code: "CL_RUT",
    country: "CL",
    name: "Chilean National / Tax Roll Number",
    localName: "Rol Único Nacional / Rol Único Tributario",
    aliases: ["RUT", "RUN"],
    purpose: "identity",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [8, 9],
    pattern: /^[1-9]\d{6,7}[\dK]$/,
    example: "123456785",
    sources: [
      "https://www.sii.cl/portales/inicio_actividades/rut.html",
      "https://www.registrocivil.cl/",
      "https://es.wikipedia.org/wiki/Rol_%C3%9Anico_Tributario",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize: compact,
    format: formatRut,
    parse(id) {
      const body = id.slice(0, -1);
      if (rutCheck(body) !== id.slice(-1)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: body, extra: {} } };
    },
  },
  {
    code: "CL_PASAPORTE",
    country: "CL",
    name: "Chilean Passport Number",
    localName: "Pasaporte",
    aliases: ["passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [8, 9],
    pattern: /^[A-Z0-9]{8,9}$/,
    example: "F12345678",
    sources: ["https://www.registrocivil.cl/principal/servicios-en-linea/pasaporte", "https://en.wikipedia.org/wiki/Chilean_passport"],
    upstream: ["nationid"],
    normalize: compact,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
