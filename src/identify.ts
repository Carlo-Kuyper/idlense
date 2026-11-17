import { ageOn } from "./core/dates.js";
import { alpha3Of, countryName, documentCountries, toAlpha2 } from "./core/countries.js";
import { compact } from "./core/normalize.js";
import { runDocument } from "./core/run.js";
import {
  DEFAULT_PURPOSES,
  type Confidence,
  type DocumentMatch,
  type DocumentSpec,
  type ExtractedData,
  type FailureReason,
  type Holder,
  type IdentifyOptions,
  type IdentifyResult,
  type IdMatch,
  type Rejection,
} from "./core/types.js";
import { ALL_DOCUMENTS } from "./countries/index.js";

const CONFIDENCE_RANK: Record<Confidence, number> = { high: 2, moderate: 1, low: 0 };
const DEFAULT_HOLDERS: readonly Holder[] = ["person", "both"];

/** Checksum-backed, higher-confidence documents first; registry order breaks ties. */
const DOCUMENTS: readonly DocumentSpec[] = [...ALL_DOCUMENTS].sort(
  (a, b) =>
    Number(b.checksum) - Number(a.checksum) || CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence],
);
const BY_CODE = new Map(DOCUMENTS.map((d) => [d.code, d]));

export function getDocument(code: string): DocumentSpec | undefined {
  return BY_CODE.get(code.toUpperCase());
}

export function listDocuments(country?: string): readonly DocumentSpec[] {
  if (!country) return DOCUMENTS;
  const a2 = toAlpha2(country);
  if (!a2) return [];
  const within = documentCountries(a2);
  return DOCUMENTS.filter((d) => within.includes(d.country));
}

export interface SupportedCountry {
  alpha2: string;
  alpha3: string;
  name: string;
  documents: { code: string; name: string; purpose: DocumentSpec["purpose"]; checksum: boolean; confidence: Confidence }[];
}

export function listSupportedCountries(): SupportedCountry[] {
  const out = new Map<string, SupportedCountry>();
  for (const d of DOCUMENTS) {
    let c = out.get(d.country);
    if (!c) {
      c = { alpha2: d.country, alpha3: alpha3Of(d.country) ?? d.country, name: countryName(d.country), documents: [] };
      out.set(d.country, c);
    }
    c.documents.push({ code: d.code, name: d.name, purpose: d.purpose, checksum: d.checksum, confidence: d.confidence });
  }
  return [...out.values()].sort((a, b) => a.alpha2.localeCompare(b.alpha2));
}

function selectDocuments(opts: IdentifyOptions, country: string | undefined): DocumentSpec[] {
  const types = opts.documentTypes && new Set(opts.documentTypes.map((t) => t.toUpperCase()));
  const within = country ? documentCountries(country) : undefined;
  const inCountry = (d: DocumentSpec) => !within || within.includes(d.country);
  if (types) return DOCUMENTS.filter((d) => types.has(d.code) && inCountry(d));
  const purposes = new Set(opts.purposes ?? DEFAULT_PURPOSES);
  const holders = new Set(opts.holders ?? DEFAULT_HOLDERS);
  const detecting = !country;
  const minRank = CONFIDENCE_RANK[opts.minConfidence ?? "moderate"];
  return DOCUMENTS.filter(
    (d) =>
      inCountry(d) &&
      purposes.has(d.purpose) &&
      holders.has(d.holder) &&
      (!detecting || opts.includeUnchecked || d.checksum) &&
      (!detecting || CONFIDENCE_RANK[d.confidence] >= minRank),
  );
}

type Hit = { spec: DocumentSpec; normalized: string; data: Omit<ExtractedData, "age"> };

/**
 * Whether this number's check digit was verified. A checksum document can accept a
 * number without verifying it (e.g. Ecuador's company RUCs, where the issuer says the
 * check is not mandatory) by returning `extra.checkDigitValid: false`.
 */
const checkPassed = (spec: DocumentSpec, data: Hit["data"]) => spec.checksum && data.extra.checkDigitValid !== false;

const FIELDS = ["dateOfBirth", "birthYear", "gender", "citizenship", "region", "regionName", "serial"] as const;

function buildMatch(country: string, hits: Hit[], referenceDate: Date): IdMatch {
  const first = hits[0]!;
  const data: ExtractedData = { extra: {} };
  const target = data as unknown as Record<string, unknown>;
  for (const h of hits) {
    for (const f of FIELDS) if (target[f] === undefined && h.data[f] !== undefined) target[f] = h.data[f];
    for (const [k, v] of Object.entries(h.data.extra)) if (!(k in data.extra)) data.extra[k] = v;
  }
  if (data.dateOfBirth) data.age = ageOn(data.dateOfBirth, referenceDate);
  else if (data.birthYear !== undefined) data.age = referenceDate.getFullYear() - data.birthYear;

  const documents: DocumentMatch[] = hits.map(({ spec, data: d }) => ({
    code: spec.code,
    name: spec.name,
    ...(spec.localName ? { localName: spec.localName } : {}),
    purpose: spec.purpose,
    holder: spec.holder,
    checksumVerified: checkPassed(spec, d),
    confidence: spec.confidence,
  }));
  return {
    country,
    countryAlpha3: alpha3Of(country) ?? country,
    countryName: countryName(country),
    documents,
    normalized: first.normalized,
    formatted: first.spec.format ? first.spec.format(first.normalized) : first.normalized,
    checksumVerified: documents.some((d) => d.checksumVerified),
    data,
  };
}

const score = (m: IdMatch) =>
  Number(m.checksumVerified) * 100 +
  Math.max(...m.documents.map((d) => CONFIDENCE_RANK[d.confidence])) * 10 +
  FIELDS.filter((f) => m.data[f] !== undefined).length;

/**
 * Validate an ID number and extract what it encodes.
 *
 * With `country`, every matching document of that country is tried (including
 * ones without a check digit). Without it, only checksum-backed documents of
 * at least `moderate` confidence are tried, in every country, and `status` is
 * `ambiguous` when several countries accept the number.
 */
export function identify(input: string, options: IdentifyOptions = {}): IdentifyResult {
  const referenceDate = options.referenceDate ?? new Date();
  const empty = { input, matches: [] as IdMatch[], rejections: [] as Rejection[] };

  if (typeof input !== "string" || compact(input) === "") return { ...empty, status: "invalid", reason: "empty" };

  let country: string | undefined;
  if (options.country) {
    country = toAlpha2(options.country);
    if (!country) return { ...empty, status: "invalid", reason: "unsupported_country" };
  }
  const specs = selectDocuments(options, country);
  if (specs.length === 0) {
    return { ...empty, status: "invalid", reason: country ? "unsupported_country" : "invalid" };
  }

  const hits = new Map<string, Hit[]>();
  const rejections: Rejection[] = [];
  for (const spec of specs) {
    const { normalized, outcome } = runDocument(spec, input, referenceDate);
    if (outcome.ok) {
      // When guessing the country, an unverified check digit is not evidence.
      if (!country && !options.documentTypes && !options.includeUnchecked && !checkPassed(spec, outcome.data)) continue;
      const list = hits.get(spec.country) ?? [];
      list.push({ spec, normalized, data: outcome.data });
      hits.set(spec.country, list);
    } else {
      rejections.push({ country: spec.country, code: spec.code, reason: outcome.reason });
    }
  }

  const prefer = (options.preferCountries ?? []).map(toAlpha2).filter((c): c is string => !!c);
  const rank = (c: string) => (prefer.includes(c) ? prefer.indexOf(c) : prefer.length);
  const matches = [...hits.entries()]
    .map(([c, h]) => buildMatch(c, h, referenceDate))
    .sort((a, b) => rank(a.country) - rank(b.country) || score(b) - score(a) || a.country.localeCompare(b.country));

  const targeted = Boolean(country || options.documentTypes);
  const kept = targeted ? rejections : [];
  if (matches.length === 0) {
    return { ...empty, status: "invalid", rejections: kept, reason: targeted ? mostSpecific(rejections) : "invalid" };
  }
  return { ...empty, status: matches.length === 1 ? "valid" : "ambiguous", match: matches[0], matches, rejections: kept };
}

/** The reason from the document that got furthest (checksum beats format beats length). */
const DEPTH: Record<FailureReason, number> = {
  empty: 0,
  unsupported_country: 0,
  invalid: 1,
  invalid_length: 2,
  invalid_format: 3,
  invalid_range: 4,
  invalid_date: 5,
  invalid_checksum: 6,
};
function mostSpecific(rejections: Rejection[]): FailureReason {
  let best: FailureReason = "invalid";
  for (const r of rejections) if (DEPTH[r.reason] > DEPTH[best]) best = r.reason;
  return best;
}

/** Shorthand: valid in `country`, or anywhere when left out. */
export function isValidId(input: string, country?: string): boolean {
  return identify(input, { country }).status !== "invalid";
}

/** Validate against one document code, e.g. `validateDocument("ZA_ID", "8001015009087")`. */
export function validateDocument(code: string, input: string, referenceDate = new Date()) {
  const spec = getDocument(code);
  if (!spec) return { ok: false as const, reason: "unsupported_country" as FailureReason };
  const { normalized, outcome } = runDocument(spec, input, referenceDate);
  if (!outcome.ok) return { ok: false as const, normalized, reason: outcome.reason };
  const data: ExtractedData = { ...outcome.data };
  if (data.dateOfBirth) data.age = ageOn(data.dateOfBirth, referenceDate);
  return {
    ok: true as const,
    normalized,
    formatted: spec.format ? spec.format(normalized) : normalized,
    data,
  };
}

export { runDocument };
