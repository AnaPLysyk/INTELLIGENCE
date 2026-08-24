import { expect } from '@playwright/test';

import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';
import { autenticarAdmin } from '../helpers';

registrarCaso('UI-POS-FIELDS-01', async (world) => {
  const page = await autenticarAdmin(world);
  const opcoes = await page.lerOpcoesDoSeletorDeBusca();
  const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rotulos = opcoes.map((opcao) => normalizar(opcao.rotulo)).filter(Boolean);

  expect(new Set(rotulos).size).toBe(rotulos.length);
  expect(opcoes.some((opcao) => normalizar(`${opcao.valor} ${opcao.rotulo}`).includes('tguid'))).toBe(true);
  expect(opcoes.some((opcao) => normalizar(`${opcao.valor} ${opcao.rotulo}`).includes('pguid'))).toBe(true);
});

registrarCaso('INT-100-I5', async (world) => {
  const page = await autenticarAdmin(world);
  await page.validarBuscaDisponivel();
});

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

  const rawPage = await world.pagina();
  await rawPage.reload({ waitUntil: 'domcontentloaded' });
  await page.validarTelaViewOnly();
  await page.validarAusenciaDeFlashDaBusca('o reload da tela view-only');
  await page.abrirRotaBusca();
  await page.validarTelaViewOnly();
  await page.abrirRotaBuscaComParametros(
    'TGUID',
    obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID),
  );
  await page.validarTelaViewOnly();
});
