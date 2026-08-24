import { request } from '@playwright/test';

import '../config/environment';
import { validarAmbienteIntegracao } from '../config/environment';
import { gerarMassaDeBuscaComDadosDoSmart } from '../utils/provisioning/intelligence';

async function main(): Promise<void> {
  validarAmbienteIntegracao();
  const contexto = await request.newContext();
  try {
    const massa = await gerarMassaDeBuscaComDadosDoSmart(contexto);
    process.stdout.write(`[massa] gerada com ${Object.keys(massa.buscas).length} tipos; ausentes=${massa.tiposAusentes.join(',') || 'nenhum'}\n`);
  } finally {
    await contexto.dispose();
  }
}

main().catch((erro) => {
  console.error('[massa]', erro);
  process.exit(1);
});
