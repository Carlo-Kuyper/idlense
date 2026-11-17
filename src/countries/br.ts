/**
 * Brazil — federal identity and tax numbers.
 *
 * - CPF (Cadastro de Pessoas Físicas), 11 digits NNNNNNNNR DD: two mod-11
 *   check digits (weights 10..2 then 11..2, remainder < 2 → 0). The 9th
 *   digit R is the fiscal region where the CPF was first registered
 *   (Receita Federal: 0 = 10ª RF (RS), 1 = DF/GO/MS/MT/TO, ... 9 = PR/SC).
 * - CNPJ (company register), 14 characters: 8-character root, 4-character
 *   branch order (0001 = head office), 2 check digits. From July 2026 the
 *   first 12 characters may be A-Z or 0-9 (IN RFB 2.229/2024; Nota Técnica
 *   COCAD/SUARA/RFB 49/2024). Each character counts as ASCII code − 48, so
 *   digits keep their value and A = 17 ... Z = 42; weights 5,4,3,2,9,8,7,6,5,4,3,2
 *   (then 6,5,4,...), remainder < 2 → 0.
 * - PIS/PASEP/NIT/NIS, 11 digits: one mod-11 check digit, weights 3,2,9,8,7,6,5,4,3,2.
 * - Título de eleitor, 12 digits: 8-digit sequence, 2-digit UF code (TSE table,
 *   28 = abroad), 2 mod-11 check digits; for SP (01) and MG (02) a remainder
 *   of 0 gives check digit 1.
 * - CNH (driver licence register number), 11 digits: 2 check digits
 *   (weights 9..1 and 1..9, with a −2 adjustment on the second when the first
 *   remainder is ≥ 10). No issuer publication found: moderate confidence.
 * - RG (state identity card): every state has its own scheme. Only the
 *   São Paulo (SSP-SP) mod-11 rule is ported, so confidence is low.
 * - Passport: 2 letters + 6 digits, no check digit on the printed number.
 *
 * Improves on upstream:
 * - idnumbers' CPF accepts all-same-digit placeholders (111.111.111-11),
 *   which Receita Federal never issues; we reject them as `invalid_range`
 *   (nationid agrees).
 * - idnumbers' CPF only accepts `.`/`-` separated or bare forms and rejects
 *   spaces; we normalise any separator.
 * - CPF now extracts the fiscal region digit and its states.
 * - CNPJ extracts the root, the branch order and whether it's the head office.
 * - RG: idnumbers requires the dotted form `NN.NNN.NNN-C`; we accept any
 *   separators and lowercase `x`.
 * - Título de eleitor extracts the UF code and name.
 */
import { weightedSum } from "../core/algorithms.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ExtractedData, ParseOutcome } from "../core/types.js";

/** Receita Federal fiscal regions (9th CPF digit). */
export const CPF_FISCAL_REGIONS: Record<string, string> = {
  "0": "RS",
  "1": "DF, GO, MS, MT, TO",
  "2": "AC, AM, AP, PA, RO, RR",
  "3": "CE, MA, PI",
  "4": "AL, PB, PE, RN",
  "5": "BA, SE",
  "6": "MG",
  "7": "ES, RJ",
  "8": "SP",
  "9": "PR, SC",
};

/** TSE UF codes used in the título de eleitor (Res. TSE 20.132/1998). */
export const TITULO_UF: Record<string, string> = {
  "01": "SP",
  "02": "MG",
  "03": "RJ",
  "04": "RS",
  "05": "BA",
  "06": "PR",
  "07": "CE",
  "08": "PE",
  "09": "SC",
  "10": "GO",
  "11": "MA",
  "12": "PB",
  "13": "PA",
  "14": "ES",
  "15": "PI",
  "16": "RN",
  "17": "AL",
  "18": "MT",
  "19": "MS",
  "20": "DF",
  "21": "SE",
  "22": "AM",
  "23": "RO",
  "24": "AC",
  "25": "AP",
  "26": "RR",
  "27": "TO",
  "28": "ZZ (abroad)",
};

const allSame = (s: string) => /^(.)\1*$/.test(s);
const ok = (data: Omit<ExtractedData, "age">): ParseOutcome => ({ ok: true, data });

/** 11 − (Σ mod 11), with remainders 0 and 1 giving 0. */
function mod11Low(sum: number): number {
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

export function cpfCheckDigits(first9: string): string {
  const d1 = mod11Low(weightedSum(first9, [10, 9, 8, 7, 6, 5, 4, 3, 2]));
  const d2 = mod11Low(weightedSum(first9 + d1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]));
  return `${d1}${d2}`;
}

const CNPJ_W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/** CNPJ check digits; characters count as ASCII − 48 (A = 17). */
export function cnpjCheckDigits(first12: string): string {
  const dv = (s: string, w: readonly number[]) => {
    let sum = 0;
    for (let i = 0; i < w.length; i++) sum += (s.charCodeAt(i) - 48) * w[i]!;
    return mod11Low(sum);
  };
  const d1 = dv(first12, CNPJ_W1);
  return `${d1}${dv(first12 + d1, CNPJ_W2)}`;
}

export function pisCheckDigit(first10: string): number {
  return mod11Low(weightedSum(first10, [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
}

export function tituloCheckDigits(first10: string): string {
  const uf = first10.slice(8, 10);
  const spMg = uf === "01" || uf === "02";
  const fix = (r: number) => (r === 10 ? 0 : r === 0 && spMg ? 1 : r);
  const d1 = fix(weightedSum(first10, [2, 3, 4, 5, 6, 7, 8, 9]) % 11);
  const d2 = fix(weightedSum(uf + d1, [7, 8, 9]) % 11);
  return `${d1}${d2}`;
}

export function cnhCheckDigits(first9: string): string {
  const r1 = weightedSum(first9, [9, 8, 7, 6, 5, 4, 3, 2, 1]) % 11;
  const d1 = r1 >= 10 ? 0 : r1;
  const dsc = r1 >= 10 ? 2 : 0;
  const r2 = (((weightedSum(first9, [1, 2, 3, 4, 5, 6, 7, 8, 9]) - dsc) % 11) + 11) % 11;
  return `${d1}${r2 >= 10 ? 0 : r2}`;
}

/** SSP-SP RG check character (0-9 or X). */
export function rgSpCheck(first8: string): string {
  const r = (11 - (weightedSum(first8, [2, 3, 4, 5, 6, 7, 8, 9]) % 11)) % 11;
  return r === 10 ? "X" : String(r);
}

const RFB_CPF = "https://www.gov.br/receitafederal/pt-br/assuntos/educacao-fiscal/educacao_fiscal/folhetos-orientativos/cadastros-dig.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "BR_CPF",
    country: "BR",
    name: "Brazilian Individual Taxpayer Registry",
    localName: "Cadastro de Pessoas Físicas",
    aliases: ["CPF"],
    purpose: "tax",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "52998224725",
    sources: [
      "https://www.gov.br/receitafederal/pt-br/servicos/cpf",
      RFB_CPF,
      "https://servicos.receita.fazenda.gov.br/servicos/cpf/inscricaopublica/inscricao.asp",
      "https://en.wikipedia.org/wiki/CPF_number",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`,
    parse(id) {
      if (allSame(id)) return { ok: false, reason: "invalid_range" };
      if (cpfCheckDigits(id.slice(0, 9)) !== id.slice(9)) return { ok: false, reason: "invalid_checksum" };
      const region = id[8]!;
      return ok({ region, regionName: CPF_FISCAL_REGIONS[region], serial: id.slice(0, 8), extra: {} });
    },
  },
  {
    code: "BR_CNPJ",
    country: "BR",
    name: "Brazilian National Registry of Legal Entities",
    localName: "Cadastro Nacional da Pessoa Jurídica",
    aliases: ["CNPJ", "CGC"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [14],
    pattern: /^[A-Z0-9]{12}\d{2}$/,
    example: "11222333000181",
    sources: [
      "https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj",
      "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/cnpj/cnpj-alfanumerico.pdf",
      "https://normasinternet2.receita.fazenda.gov.br/#/consulta/externa/141102",
    ],
    upstream: ["nationid"],
    normalize: compact,
    format: (c) => `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`,
    parse(id) {
      if (allSame(id)) return { ok: false, reason: "invalid_range" };
      if (cnpjCheckDigits(id.slice(0, 12)) !== id.slice(12)) return { ok: false, reason: "invalid_checksum" };
      const branch = id.slice(8, 12);
      return ok({
        serial: id.slice(0, 8),
        extra: { root: id.slice(0, 8), branch, headquarters: branch === "0001", alphanumeric: /[A-Z]/.test(id) },
      });
    },
  },
  {
    code: "BR_PIS",
    country: "BR",
    name: "Brazilian Social Integration Program Number",
    localName: "PIS/PASEP/NIT/NIS",
    aliases: ["PIS", "PASEP", "NIT", "NIS"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "12056412545",
    sources: [
      "https://www.caixa.gov.br/beneficios-trabalhador/pis/Paginas/default.aspx",
      "https://www.gov.br/esocial/pt-br/documentacao-tecnica",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 3)}.${c.slice(3, 8)}.${c.slice(8, 10)}-${c.slice(10)}`,
    parse(id) {
      if (allSame(id)) return { ok: false, reason: "invalid_range" };
      if (pisCheckDigit(id.slice(0, 10)) !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
      return ok({ extra: {} });
    },
  },
  {
    code: "BR_TITULO_ELEITOR",
    country: "BR",
    name: "Brazilian Voter Registration Number",
    localName: "Título de Eleitor",
    aliases: ["inscrição eleitoral", "voter ID"],
    purpose: "voter",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [12],
    // UF 01-28
    pattern: /^\d{8}(0[1-9]|1\d|2[0-8])\d{2}$/,
    example: "004356870906",
    sources: [
      "https://sintse.tse.jus.br/documentos/1998/Abr/22/diario-da-justica-secao-1/resolucao-no-20-132-de-19-de-marco-de-1998-dispoe-sobre-o-alistamento-e-servicos-eleitorais-mediante",
      "https://www.tse.jus.br/legislacao/compilada/res/2003/resolucao-no-21-538-de-14-de-outubro-de-2003",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 2, 2], " "),
    parse(id) {
      if (allSame(id)) return { ok: false, reason: "invalid_range" };
      if (tituloCheckDigits(id.slice(0, 10)) !== id.slice(10)) return { ok: false, reason: "invalid_checksum" };
      const region = id.slice(8, 10);
      return ok({ region, regionName: TITULO_UF[region], serial: id.slice(0, 8), extra: {} });
    },
  },
  {
    code: "BR_CNH",
    country: "BR",
    name: "Brazilian Driver's Licence Register Number",
    localName: "Carteira Nacional de Habilitação (número de registro)",
    aliases: ["CNH", "RENACH"],
    purpose: "driver_license",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "02650306461",
    sources: [
      "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/resolucao_192_06.doc",
      "https://www.legisweb.com.br/legislacao/?id=286555",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 9)}-${c.slice(9)}`,
    parse(id) {
      if (allSame(id)) return { ok: false, reason: "invalid_range" };
      if (cnhCheckDigits(id.slice(0, 9)) !== id.slice(9)) return { ok: false, reason: "invalid_checksum" };
      return ok({ serial: id.slice(0, 9), extra: {} });
    },
  },
  {
    code: "BR_RG",
    country: "BR",
    name: "Brazilian General Registry (São Paulo)",
    localName: "Registro Geral",
    aliases: ["RG", "carteira de identidade"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "low",
    lengths: [9],
    pattern: /^\d{8}[\dX]$/,
    example: "123456782",
    sources: ["https://en.wikipedia.org/wiki/Brazilian_identity_card"],
    upstream: ["idnumbers"],
    format: (c) => `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}-${c.slice(8)}`,
    parse(id) {
      if (rgSpCheck(id.slice(0, 8)) !== id[8]) return { ok: false, reason: "invalid_checksum" };
      return ok({ serial: id.slice(0, 8), extra: { scheme: "SSP-SP" } });
    },
  },
  {
    code: "BR_PASAPORTE",
    country: "BR",
    name: "Brazilian Passport Number",
    localName: "Passaporte",
    aliases: ["passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [8],
    pattern: /^[A-Z]{2}\d{6}$/,
    example: "FA123456",
    sources: ["https://www.gov.br/pf/pt-br/assuntos/passaporte", "https://en.wikipedia.org/wiki/Brazilian_passport"],
    upstream: ["nationid"],
    parse: () => ok({ extra: {} }),
  },
];
