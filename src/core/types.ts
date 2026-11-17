/**
 * Public types and the contract every document module implements.
 *
 * Document codes (`ZA_ID`, `NO_FNR`, ...) are stable: callers persist them.
 * Never rename or repurpose one once shipped; add a new code instead.
 */

export type Gender = "male" | "female";

export type FailureReason =
  | "empty"
  | "unsupported_country"
  | "invalid_length"
  | "invalid_format"
  | "invalid_checksum"
  | "invalid_date"
  /** Structurally fine but uses a reserved/unissued range (e.g. SSN 000-xx-xxxx, 666). */
  | "invalid_range"
  | "invalid";

/**
 * What the document is for.
 * - `identity`: national ID / personal number
 * - `social_security`: SSN, NINO, NUSS, ...
 * - `migratory`: numbers for foreign residents (ES NIE, SG FIN, NO D-nummer)
 * - `tax`: personal or company tax numbers (CPF, RFC, VAT)
 * - `voter`, `driver_license`, `passport`, `health`
 */
export type Purpose =
  | "identity"
  | "social_security"
  | "migratory"
  | "tax"
  | "voter"
  | "driver_license"
  | "passport"
  | "health";

export const DEFAULT_PURPOSES: readonly Purpose[] = ["identity", "social_security", "migratory"];

/** Who the number belongs to. Company numbers are skipped unless asked for. */
export type Holder = "person" | "entity" | "both";

/**
 * How sure we are that our rules match the issuer's:
 * - `high`: published by the issuer or in law, and cross-checked against real numbers
 * - `moderate`: consistent secondary sources (Wikipedia + independent libraries)
 * - `low`: a single or reverse-engineered source; treat matches as a hint
 */
export type Confidence = "high" | "moderate" | "low";

/** What an ID number encodes, in one shape for every country. */
export interface ExtractedData {
  /** `YYYY-MM-DD`. A plain string so it never shifts with the server timezone. */
  dateOfBirth?: string;
  /** Set when only the year is encoded (or alongside `dateOfBirth`). */
  birthYear?: number;
  /** Whole years on `referenceDate`. Filled in by `identify`, not by document modules. */
  age?: number;
  gender?: Gender;
  /** e.g. `citizen`, `permanent_resident`, `refugee`, `resident`, `foreigner`. */
  citizenship?: string;
  /** Region/province/state/birthplace code as encoded in the number. */
  region?: string;
  /** Human-readable name for `region`, when the module has a table for it. */
  regionName?: string;
  /** Sequence/serial part of the number. */
  serial?: string;
  /** Country-specific fields that don't map to the ones above. camelCase keys, JSON-safe values. */
  extra: Record<string, string | number | boolean>;
}

export interface ParseContext {
  /** "Today", for century inference and rejecting future birth dates. */
  referenceDate: Date;
}

export type ParseOutcome =
  | { ok: true; data: Omit<ExtractedData, "age"> }
  | { ok: false; reason: FailureReason };

/** Which open-source project a module's logic was ported from (for THIRD_PARTY_NOTICES). */
export type Upstream =
  | "idnumbers"
  | "nationid"
  | "norwegian-national-id-validator"
  | "south-african-id-validator"
  | "south-african-id-parser"
  | "personal-identity-validation";

export interface DocumentSpec {
  /** `{ALPHA2}_{TYPE}`, e.g. `ZA_ID`. Stable. */
  code: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** English name, e.g. "Norwegian National Identity Number". */
  name: string;
  /** Name in the issuing country, e.g. "Fødselsnummer". */
  localName?: string;
  /** Other names people search for, e.g. ["FNR", "birth number"]. */
  aliases?: string[];
  purpose: Purpose;
  holder: Holder;
  /** True when a check digit/letter is verified, not only the shape. */
  checksum: boolean;
  /**
   * Position of the check character in the compact form. Negative counts from
   * the end. Default -1 (last). Used by the contract tests.
   */
  checkIndex?: number;
  /**
   * False when more than one value at `checkIndex` can pass (e.g. Taiwan's UBN,
   * where a 7 in position 7 allows two check results). Default true.
   */
  checkUnique?: boolean;
  confidence: Confidence;
  /** Valid compact lengths. Used to report `invalid_length` before `invalid_format`. */
  lengths: readonly number[];
  /** Compact form (after `normalize`). A match is required before `parse` runs. */
  pattern: RegExp;
  /** A valid compact example (synthetic; never a real person's number). */
  example: string;
  /** Issuer docs, laws, or reference pages the rules come from. At least one. */
  sources: readonly string[];
  /** Upstream projects this module ports logic from. */
  upstream?: readonly Upstream[];
  /** Replaced by a newer document but still in circulation. */
  deprecated?: boolean;
  /** Strip separators. Default: `compact()` from core/normalize. */
  normalize?(input: string): string;
  /** Display form of a valid compact number. Default: the compact form. */
  format?(compact: string): string;
  /** Validate a compact number that already matches `pattern`, and extract its data. */
  parse(compact: string, ctx: ParseContext): ParseOutcome;
}

// ---------------------------------------------------------------------------
// identify() result types
// ---------------------------------------------------------------------------

export interface DocumentMatch {
  code: string;
  name: string;
  localName?: string;
  purpose: Purpose;
  holder: Holder;
  checksumVerified: boolean;
  confidence: Confidence;
}

export interface IdMatch {
  /** ISO 3166-1 alpha-2. */
  country: string;
  countryAlpha3: string;
  countryName: string;
  /** Every document type the number is valid as in this country; the best first. */
  documents: DocumentMatch[];
  normalized: string;
  formatted: string;
  checksumVerified: boolean;
  data: ExtractedData;
}

export interface Rejection {
  country: string;
  code: string;
  reason: FailureReason;
}

export type IdentifyStatus = "valid" | "ambiguous" | "invalid";

export interface IdentifyResult {
  input: string;
  /**
   * - `valid`: exactly one country matched
   * - `ambiguous`: no country was given and several accept the number (see `matches`)
   * - `invalid`: nothing matched (see `reason`, and `rejections` when a country was given)
   */
  status: IdentifyStatus;
  /** The match when `valid`; the best-ranked one when `ambiguous`. */
  match?: IdMatch;
  matches: IdMatch[];
  /** Why each tried document rejected the number. Only filled when a country or documentTypes was given. */
  rejections: Rejection[];
  reason?: FailureReason;
}

export interface IdentifyOptions {
  /** ISO alpha-2 or alpha-3, any case. Leave out to detect. */
  country?: string;
  /** Only try these codes, e.g. `["ZA_ID"]`. Overrides `purposes` and `holders`. */
  documentTypes?: string[];
  /** Default `DEFAULT_PURPOSES`. */
  purposes?: Purpose[];
  /** Default `["person", "both"]`. Add `"entity"` for company numbers. */
  holders?: Holder[];
  /** When detecting, also try documents without a check digit. Off by default: they match too much. */
  includeUnchecked?: boolean;
  /** When detecting, minimum confidence to try. Default `moderate`. */
  minConfidence?: Confidence;
  /** Ranks these countries first when several match. Alpha-2 or alpha-3. */
  preferCountries?: string[];
  /** "Today" for age and century inference. Default `new Date()`. */
  referenceDate?: Date;
}
