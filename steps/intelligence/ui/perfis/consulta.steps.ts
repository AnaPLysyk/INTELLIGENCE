import { expect } from '@playwright/test';

import { ProfileHistoryPage } from '../../../../pom/intelligence/profile/history.page';
import {
  abrirSessaoIntelligenceApi,
  obterDetalhesPerfilIntelligence,
} from '../../../../utils/api/intelligence';
import { extrairPguidsPreviousHistory } from '../../../../utils/api/profile-history';
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
  const respostaPromise = rawPage.waitForResponse(
    (response) => response.request().method() === 'GET'
      && response.url().includes(`/service/profile/person/${pguid}`),
    { timeout: 30_000 },
  );

  await page.abrirDetalhesDoPerfilPorPguid(pguid);
  const resposta = await respostaPromise;

  expect(
    resposta.status(),
    'Consultar PGUID inexistente em modo view-only não deve provocar erro interno do servidor.',
  ).toBeLessThan(500);

  await expect(
    rawPage.getByText(/perfil.*n[aã]o encontrado|n[aã]o encontrado|nenhum resultado encontrado|not found/i).first(),
    'A UI deve indicar que o perfil solicitado não foi encontrado.',
  ).toBeVisible({ timeout: 15_000 });

  await page.validarBuscaIndisponivel();
});

registrarCaso('INT-24-UI-01', async (world) => {
  await world.garantirMassa();
  const pguidAtual = obterValorObrigatorioDaMassa('PGUID', process.env.INT_24_PGUID);

  const api = await world.api();
  const sessao = await abrirSessaoIntelligenceApi(api, world.credenciaisAdmin());
  const respostaPerfil = await obterDetalhesPerfilIntelligence(api, pguidAtual, sessao.sessionGuid);
  if (respostaPerfil.response.status() !== 200) {
    throw new Error(
      `BLOQUEADO: não foi possível consultar o previousHistory do PGUID de massa. HTTP ${respostaPerfil.response.status()}.`,
    );
  }

  const pguidsPreviousHistory = extrairPguidsPreviousHistory(respostaPerfil.body)
    .filter((pguid) => pguid.toUpperCase() !== pguidAtual.toUpperCase());
  if (pguidsPreviousHistory.length === 0) {
    throw new Error(
      'BLOQUEADO: o PGUID selecionado para INT-24 não possui previousHistory com PGUIDs anteriores; '
      + 'é necessária massa proveniente de unificação para validar o critério de aceite.',
    );
  }

  console.log(`INT24_PREVIOUS_HISTORY|pguidAtual=${pguidAtual}|pguids=${pguidsPreviousHistory.length}`);

  const page = await autenticarAdmin(world);
  await page.abrirDetalhesDoPerfilPorPguid(pguidAtual);
  await page.validarDetalhesDoPerfilCarregados(pguidAtual);
  await new ProfileHistoryPage(await world.pagina()).validarPreviousHistory(pguidsPreviousHistory);
});
