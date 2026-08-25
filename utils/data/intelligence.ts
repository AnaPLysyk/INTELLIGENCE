import fs from 'node:fs';
import path from 'node:path';

export type IdentidadeEsperada = {
  processId: number;
  pguid: string;
  tguid: string;
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  externalId?: string;
};

export type EntradaMassaBusca = {
  seletor: string;
  valor: string;
  kind?: string;
  origem: 'SMART.Process' | 'SMART API' | 'GBDS API' | 'INTELLIGENCE API' | 'FIXTURE_VALIDADA';
  esperado: IdentidadeEsperada;
};

export type ArquivoMassaBusca = {
  schemaVersion: 1;
  geradoEm: string;
  fonte:
    | 'SMART_API_E_BD_SOMENTE_LEITURA'
    | 'SMART_API_BD_E_GBDS_SOMENTE_LEITURA'
    | 'SMART_API_BD_GBDS_E_FIXTURE_VALIDADA';
  buscas: Record<string, EntradaMassaBusca>;
  tiposAusentes: string[];
};

export function caminhoArquivoMassa(): string {
  return path.resolve(process.env.INTELLIGENCE_MASSA_FILE?.trim() || 'test-data/generated/intelligence.busca.massa.json');
}

export function lerMassaBusca(): ArquivoMassaBusca;
export function lerMassaBusca(opcional: true): ArquivoMassaBusca | undefined;
export function lerMassaBusca(opcional = false): ArquivoMassaBusca | undefined {
  const arquivo = caminhoArquivoMassa();
  if (!fs.existsSync(arquivo)) {
    if (opcional) return undefined;
    throw new Error(`BLOQUEADO: massa nao encontrada em ${arquivo}. Execute npm run massa:smart.`);
  }
  const massa = JSON.parse(fs.readFileSync(arquivo, 'utf8')) as ArquivoMassaBusca;
  if (massa.schemaVersion !== 1 || ![
    'SMART_API_E_BD_SOMENTE_LEITURA',
    'SMART_API_BD_E_GBDS_SOMENTE_LEITURA',
    'SMART_API_BD_GBDS_E_FIXTURE_VALIDADA',
  ].includes(massa.fonte)) {
    throw new Error(`AUTOMATION ERROR: arquivo de massa incompativel: ${arquivo}.`);
  }
  return massa;
}

export function obterValorObrigatorioDaMassa(tipo: string, fallback?: string): string {
  const valor = fallback?.trim() || lerMassaBusca(true)?.buscas[tipo]?.valor;
  if (!valor) throw new Error(`BLOQUEADO: a massa nao possui um valor para ${tipo}.`);
  return valor;
}
