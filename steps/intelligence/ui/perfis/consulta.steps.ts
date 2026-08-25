import { expect } from '@playwright/test';

import { ProfileHistoryPage } from '../../../../pom/intelligence/profile/history.page';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';
import { autenticarAdmin } from '../helpers';

registrarCaso('INT-17-PGUID-UI', async (world) => {
  const massa = await world.garantirMassa();
  const transacao = massa.buscas.TGUID;
  if (!transacao?.valor || !transacao.esperado.pguid) {
    throw new Error('BLOQUEADO: a massa de TGUID não informa o PGUID vinculado.');
  }

  const page = await autenticarAdmin(world);
  await page.abrirPerfilVinculadoNaTransacao(transacao.valor, transacao.esperado.pguid);
  await page.validarNavegacaoDoPerfilReconhecida();
});

registrarCaso('INT-100-I2', async (world) => {
  await world.garantirMassa();
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);
  await page.abrirDetalhesDoPerfilPorPguid(pguid);
  await page.validarDetalhesDoPerfilCarregados(pguid);
  await page.validarAusenciaDeControlesDeEscrita();
});

registrarCaso('INT-100-I3', async (world) => {
  const page = await world.intelligence();
  const pguid = crypto.randomUUID().toUpperCase();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  const rawPage = await world.pagina();
  const resposta = rawPage.waitForResponse(
    (response) => response.request().method() === 'GET'
      && response.url().includes(`/service/profile/person/${pguid}`),
    { timeout: 30_000 },
  );
  await page.abrirDetalhesDoPerfilPorPguid(pguid);
  await resposta;
  await expect.soft(
    rawPage.getByText(/a busca n[aã]o est[aá] dispon[ií]vel para o seu usu[aá]rio/i).first(),
  ).toBeVisible({ timeout: 10_000 });
  await expect.soft(
    rawPage.getByText(/perfil.*n[aã]o encontrado|n[aã]o encontrado|nenhum resultado encontrado|not found/i).first(),
  ).toBeVisible({ timeout: 10_000 });
});

registrarCaso('INT-24-UI-01', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  const pguidAtual = obterValorObrigatorioDaMassa('PGUID', process.env.INT_24_PGUID);
  await page.abrirDetalhesDoPerfilPorPguid(pguidAtual);
  await page.validarDetalhesDoPerfilCarregados(pguidAtual);
  const historico = new ProfileHistoryPage(await world.pagina());
  await historico.navegarParaPerfilAnteriorNoHistorico(pguidAtual);
});
