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
  await world.garantirMassa();
  const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_17_PGUID);

  const page = await autenticarAdmin(world);
  await page.abrirDetalhesDoPerfilPorPguid(pguid);
  await page.validarDetalhesDoPerfilCarregados(pguid);
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
  await world.garantirMassa();
  const page = await world.intelligence();
  const pguidValido = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);
  const pguidInexistente = crypto.randomUUID().toUpperCase();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());

  const rawPage = await world.pagina();

  const respostaValidaPromise = rawPage.waitForResponse(
    (response) => response.request().method() === 'GET'
      && response.url().includes(`/service/profile/person/${pguidValido}`),
    { timeout: 30_000 },
  );
  await page.abrirDetalhesDoPerfilPorPguid(pguidValido);
  const respostaValida = await respostaValidaPromise;

  console.log(
    `INT100_VIEWONLY_CONTROL|pguid=${pguidValido}|http=${respostaValida.status()}|url=${respostaValida.url()}`,
  );
  if (respostaValida.status() !== 200) {
    throw new Error(
      `BLOQUEADO: a execução atual não possui a pré-condição view-only válida do INT-100; `
      + `o PGUID de controle retornou HTTP ${respostaValida.status()}. `
      + 'Execute o cenário dentro do perfil Ranger int100ViewOnly antes de classificar o hardening de not-found.',
    );
  }

  const respostaInexistentePromise = rawPage.waitForResponse(
    (response) => response.request().method() === 'GET'
      && response.url().includes(`/service/profile/person/${pguidInexistente}`),
    { timeout: 30_000 },
  );

  await page.abrirDetalhesDoPerfilPorPguid(pguidInexistente);
  const respostaInexistente = await respostaInexistentePromise;
  const corpoResposta = await respostaInexistente.text().catch(() => '');
  const corpoDiagnostico = corpoResposta.replace(/\s+/g, ' ').trim().slice(0, 1200);

  console.log(
    `INT100_NOTFOUND_RESPONSE|http=${respostaInexistente.status()}|url=${respostaInexistente.url()}|body=${JSON.stringify(corpoDiagnostico)}`,
  );

  expect(
    respostaInexistente.status(),
    `Consultar PGUID inexistente em modo view-only não deve provocar erro interno do servidor. `
      + `HTTP=${respostaInexistente.status()} body=${corpoDiagnostico || '<vazio>'}`,
  ).toBeLessThan(500);

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
