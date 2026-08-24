import { expect } from '@playwright/test';

import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';
import { autenticarAdmin } from '../helpers';

registrarCaso('INT-30-UI-01', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_30_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
  const download = await page.exportarNistDaTelaAtual();
  expect(download.suggestedFilename().trim().length).toBeGreaterThan(0);
});

registrarCaso('INT-30-NIST-02', async () => {
  throw new Error(
    'BLOQUEADO: INT-30 não informa no Jira qual tipo de imagem deve existir no NIST nem a regra de inspeção do arquivo.',
  );
});
