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
  kind?: 'KEY' | 'BIOGRAPHIC' | 'EXTERNAL_ID';
  origem: 'SMART.Process' | 'SMART API';
  esperado: IdentidadeEsperada;
};

export type ArquivoMassaBusca = {
  schemaVersion: 1;
  geradoEm: string;
  fonte: 'SMART_API_E_BD_SOMENTE_LEITURA';
  buscas: Record<string, EntradaMassaBusca>;
  tiposAusentes: string[];
};

export function caminhoArquivoMassa(): string {
  return path.resolve(process.env.INTELLIGENCE_MASSA_FILE?.trim() || 'test-data/generated/intelligence.busca.massa.json');
}

export function lerMassaBusca(opcional = false): ArquivoMassaBusca | undefined {
  const arquivo = caminhoArquivoMassa();
  if (!fs.existsSync(arquivo)) {
    if (opcional) return undefined;
    throw new Error(`BLOQUEADO: massa nao encontrada em ${arquivo}. Execute npm run massa:smart.`);
  }
  const massa = JSON.parse(fs.readFileSync(arquivo, 'utf8')) as ArquivoMassaBusca;
  if (massa.schemaVersion !== 1 || massa.fonte !== 'SMART_API_E_BD_SOMENTE_LEITURA') {
    throw new Error(`AUTOMATION ERROR: arquivo de massa incompativel: ${arquivo}.`);
  }
  return massa;
}

export function valorMassa(tipo: string, fallback?: string): string | undefined {
  return fallback?.trim() || lerMassaBusca(true)?.buscas[tipo]?.valor;
}
