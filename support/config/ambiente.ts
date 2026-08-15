import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

const ambienteHerdado = { ...process.env };

function lerArquivoEnv(arquivo: string): Record<string, string> {
  if (!fs.existsSync(arquivo)) return {};
  return dotenv.parse(fs.readFileSync(arquivo));
}

function aplicarSeAusente(nome: string, valor?: string): void {
  if (ambienteHerdado[nome]?.trim()) return;
  if (valor?.trim()) process.env[nome] = valor.trim();
}

const arquivoLocal = path.resolve(process.cwd(), '.env.local');
const ambienteLocal = lerArquivoEnv(arquivoLocal);

for (const [nome, valor] of Object.entries(ambienteLocal)) {
  aplicarSeAusente(nome, valor);
}

function alias(destino: string, ...fontes: string[]): void {
  if (process.env[destino]?.trim()) return;

  for (const fonte of fontes) {
    const valor = process.env[fonte]?.trim();

    if (valor) {
      process.env[destino] = valor;
      return;
    }
  }
}

alias('INTELLIGENCE_UI_URL', 'INTELLIGENCE_UI_URL');
alias('INTELLIGENCE_ADMIN_USERNAME', 'SMART_UI_USERNAME');
alias('INTELLIGENCE_ADMIN_PASSWORD', 'SMART_UI_PASSWORD');

process.env.INT_100_TRANSACAO_URL_TEMPLATE ||= '{base}/transaction/{tguid}';
process.env.INT_100_PERFIL_URL_TEMPLATE ||= '{base}/profile/{pguid}';

export function validarAmbienteIntegracao(): void {
  const obrigatorias = [
    'INTELLIGENCE_UI_URL',
    'INTELLIGENCE_ADMIN_USERNAME',
    'INTELLIGENCE_ADMIN_PASSWORD',
    'SMART_API_BASE_URL',
    'SMART_UI_USERNAME',
    'SMART_UI_PASSWORD',
    'SMART_DB_HOST',
    'SMART_DB_USER',
    'SMART_DB_PASSWORD',
    'GBDS_API_BASE_URL',
    'GBDS_USERNAME',
    'GBDS_PASSWORD',
  ];

  const ausentes = obrigatorias.filter((nome) => !process.env[nome]?.trim());

  if (ausentes.length > 0) {
    throw new Error(
      `CONFIGURACAO: ambiente integrado incompleto (${ausentes.join(', ')}). `
      + 'Defina as variaveis no .env.local ou injete os secrets no processo/CI.',
    );
  }
}
