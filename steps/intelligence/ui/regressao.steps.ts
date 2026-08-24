import { expect } from '@playwright/test';

import type { IntelligenceWorld } from '../../../cucumber/world';
import { registrarCaso } from '../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../utils/data/intelligence';
import { autenticarSmart, consultarProcessoSmart } from '../../../utils/integrations/smart';

function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`BLOQUEADO: configure ${nome} com a massa especifica do ticket.`);
  return valor;
}

async function autenticarAdmin(world: IntelligenceWorld) {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(world.credenciaisAdmin());
  return page;
}

function idsCampos(detalhes: unknown, propriedade: 'keys' | 'biographics'): string[] {
  if (!detalhes || typeof detalhes !== 'object' || Array.isArray(detalhes)) return [];
  const raiz = detalhes as Record<string, unknown>;
  const data = raiz.data && typeof raiz.data === 'object' && !Array.isArray(raiz.data)
    ? raiz.data as Record<string, unknown>
    : raiz;
  const lista = data[propriedade];
  if (!Array.isArray(lista)) return [];
  return [...new Set(lista.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const id = (item as Record<string, unknown>).id;
    return typeof id === 'string' && id.trim() ? [id.trim()] : [];
  }))];
}

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

registrarCaso('INT-100-I6', async (world) => {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  await page.abrirConfiguracoesPeloHeader();
  await page.abrirTelaViewOnlyPeloLogo();
  await page.validarTelaViewOnly();
});

registrarCaso('INT-100-I4', async (world) => {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  await page.abrirConfiguracoesPeloHeader();
  await page.validarConfiguracoesDisponiveisViewOnly();
});

registrarCaso('INT-100-BASELINE', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
});

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

registrarCaso('INT-100-I1', async (world) => {
  await world.garantirMassa();
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
  await page.validarAusenciaDeControlesDeEscrita();
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

registrarCaso('INT-31-UI-01', async (world) => {
  const massa = await world.garantirMassa();
  const transacao = massa.buscas.TGUID;
  if (!transacao?.valor || !transacao.esperado.processId) {
    throw new Error('BLOQUEADO: a massa de TGUID não informa a transação SMART de origem.');
  }
  const request = await world.api();
  const token = await autenticarSmart(request);
  const detalhes = await consultarProcessoSmart(request, token, transacao.esperado.processId);
  const chaves = idsCampos(detalhes, 'keys');
  const biograficos = idsCampos(detalhes, 'biographics');
  if (!chaves.length || !biograficos.length) {
    throw new Error('BLOQUEADO: a transação SMART não possui campos suficientes para validar edição.');
  }
  const page = await autenticarAdmin(world);
  await page.abrirDetalhesDaTransacaoPorTguid(transacao.valor);
  await page.validarDetalhesDaTransacaoCarregados(transacao.valor);
  await page.abrirEdicaoAtual();
  for (const chave of chaves) await page.validarCampoNaoDisponivelParaEdicao(chave);
  await page.validarCampoDisponivelParaEdicao(biograficos[0]);
});

for (const [id, tipo, campoEnv] of [
  ['INT-40-UI-01', 'transacao', 'INT_40_DATE_FIELD_LABEL'],
  ['INT-40-UI-02', 'perfil', 'INT_40_DATE_FIELD_LABEL'],
] as const) {
  registrarCaso(id, async (world) => {
    await world.garantirMassa();
    const page = await autenticarAdmin(world);
    const campo = envObrigatoria(campoEnv);
    if (tipo === 'transacao') {
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_40_TGUID);
      await page.abrirDetalhesDaTransacaoPorTguid(tguid);
      await page.validarDetalhesDaTransacaoCarregados(tguid);
    } else {
      await page.abrirDetalhesDoPerfilPorPguid(obterValorObrigatorioDaMassa('PGUID', process.env.INT_40_PGUID));
    }
    await page.abrirEdicaoAtual();
    await page.validarCampoDataPreenchidoNaEdicao(campo);
  });
}

registrarCaso('INT-32-UI-01', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_32_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
  await page.abrirEdicaoAtual();
  await page.validarCampoDataComCalendarioNaEdicao(envObrigatoria('INT_32_DATE_FIELD_LABEL'));
});

registrarCaso('INT-24-UI-01', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  await page.abrirDetalhesDoPerfilPorPguid(obterValorObrigatorioDaMassa('PGUID', process.env.INT_24_PGUID));
  await page.validarHistoricoDePerfisAnteriores(envObrigatoria('INT_24_PREVIOUS_PGUID'));
});

registrarCaso('INT-30-UI-01', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_30_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
  const download = await page.exportarNistDaTelaAtual();
  expect(download.suggestedFilename().trim().length).toBeGreaterThan(0);
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
  const resposta = rawPage.waitForResponse(
    (response) => response.request().method() === 'GET' && response.url().includes(`/service/profile/person/${pguid}`),
    { timeout: 30_000 },
  );
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
