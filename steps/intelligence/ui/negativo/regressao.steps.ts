import { expect } from '@playwright/test';

import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';

registrarCaso('UI-NEG-EMPTY-01', async (world) => {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(world.credenciaisAdmin());
  const navegacao = await page.tentarPesquisarComValorVazio();
  expect(navegacao.urlDepois).toBe(navegacao.urlAntes);
});
registrarCaso('UI-DES-XSS-01', async (world) => {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(world.credenciaisAdmin());
  const resultado = await page.submeterEntradaHostilNaBusca('<script>alert("intelligence-xss")</script>');
  expect(resultado.dialogoAberto).toBe(false);
  expect(resultado.scriptInjetado).toBe(false);
});
registrarCaso('INT-100-R3', async (world) => {
  await world.garantirMassa();
  const page = await world.intelligence();
  await page.instalarMonitorBuscaTransitoriaViewOnly();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  await page.validarTelaViewOnly();
  await page.validarAusenciaDeFlashDaBusca('o login do view-only');
  await page.limparEventosBuscaTransitoriaViewOnly();
  const p = await world.pagina();
  await p.reload({ waitUntil: 'domcontentloaded' });
  await page.validarTelaViewOnly();
  await page.validarAusenciaDeFlashDaBusca('o reload da tela view-only');
  await page.abrirRotaBusca();
  await page.validarTelaViewOnly();
  await page.abrirRotaBuscaComParametros('TGUID', obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID));
  await page.validarTelaViewOnly();
});
registrarCaso('INT-100-I7', async (world) => {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  await page.abrirPaginaNaoEncontrada();
  await page.voltarDaPaginaNaoEncontrada();
  await page.validarTelaViewOnly();
});
registrarCaso('INT-100-I3', async (world) => {
  const page = await world.intelligence();
  const pguid = crypto.randomUUID().toUpperCase();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  const rawPage = await world.pagina();
  const resposta = rawPage.waitForResponse((response) => response.request().method() === 'GET' && response.url().includes(`/service/profile/person/${pguid}`), { timeout: 30_000 });
  await page.abrirDetalhesDoPerfilPorPguid(pguid);
  await resposta;
  await expect.soft(rawPage.getByText(/a busca n[aã]o est[aá] dispon[ií]vel para o seu usu[aá]rio/i).first()).toBeVisible({ timeout: 10_000 });
  await expect.soft(rawPage.getByText(/perfil.*n[aã]o encontrado|n[aã]o encontrado|nenhum resultado encontrado|not found/i).first()).toBeVisible({ timeout: 10_000 });
});
registrarCaso('UI-NEG-AUTH-NOACCESS-01', async (world) => {
  const page = await world.intelligence();
  await page.validarAutenticacaoNegadaComCredenciais(world.credenciaisSemPermissao());
});
registrarCaso('INT-33-SPEC-01', async () => {
  throw new Error('BLOQUEADO: INT-33 não informa quais campos devem ser convertidos para maiúsculas nem quais validações são esperadas.');
});
registrarCaso('INT-30-NIST-02', async () => {
  throw new Error('BLOQUEADO: INT-30 não informa no Jira qual tipo de imagem deve existir no NIST nem a regra de inspeção do arquivo.');
});
