import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { IntelligencePage, type CredenciaisIntelligence } from '../../../support/functions/ui/intelligence/intelligence.page';
import { obterValorObrigatorioDaMassa } from '../../../support/massas/dados/intelligence.busca.massa';

const TAGS = ['@ui', '@intelligence'];

function obterCredenciaisAdministrativas(): CredenciaisIntelligence {
  const usuario = process.env.INTELLIGENCE_ADMIN_USERNAME?.trim();
  const senha = process.env.INTELLIGENCE_ADMIN_PASSWORD?.trim();
  if (!usuario || !senha) throw new Error('CONFIGURACAO: credenciais administrativas ausentes.');
  return { usuario, senha };
}

function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`BLOQUEADO: configure ${nome} com a massa especifica do ticket.`);
  return valor;
}

test.describe('Intelligence UI — cobertura historica por ticket e release', () => {
  test.setTimeout(120_000);

  test(
    '[INT-31-UI-01] Não disponibiliza campos de chave para edição da transação',
    {
      tag: [...TAGS, '@regression', '@int-31', '@introduced-in-1.8.1', '@editing', '@biographics'],
    },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_31_TGUID);
      const chave = envObrigatoria('INT_31_KEY_FIELD_LABEL');
      const biografico = envObrigatoria('INT_31_BIOGRAPHIC_FIELD_LABEL');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-31',
        release: '1.8.1',
        objetivo: 'Renderizar na edição somente campos biográficos, sem permitir edição das chaves',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('uma transação válida está aberta', async () => {
        await intelligence.abrirDetalhesDaTransacaoPorTguid(tguid);
        await intelligence.validarDetalhesDaTransacaoCarregados(tguid);
      });
      await bdd.quando('abre a edição da transação', () => intelligence.abrirEdicaoAtual());
      await bdd.entao('o campo de chave não está disponível para edição', () =>
        intelligence.validarCampoNaoDisponivelParaEdicao(chave));
      await bdd.e('um campo biográfico continua disponível para edição', () =>
        intelligence.validarCampoDisponivelParaEdicao(biografico));
    },
  );

  test(
    '[INT-33-SPEC-01] Exige critérios verificáveis para padronização e validação de campos',
    {
      tag: [...TAGS, '@int-33', '@introduced-in-1.8.1', '@coverage-gap', '@specification'],
    },
    async ({}, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-33',
        release: '1.8.1',
        objetivo: 'Evitar automatizar uma regra de padronização sem critérios observáveis no ticket',
      });
      await bdd.dado('que o ticket informa apenas padronização em letra maiúscula e validação de campos', async () => {
        throw new Error(
          'BLOQUEADO: INT-33 não informa quais campos devem ser convertidos para maiúsculas nem quais validações são esperadas.',
        );
      });
    },
  );

  test(
    '[INT-40-UI-01] Mantém o valor do campo de data ao editar uma transação',
    {
      tag: [...TAGS, '@regression', '@int-40', '@introduced-in-1.8.2', '@editing', '@date'],
    },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_40_TGUID);
      const campoData = envObrigatoria('INT_40_DATE_FIELD_LABEL');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-40',
        release: '1.8.2',
        objetivo: 'Preservar o valor atual do biográfico de data ao abrir a edição da transação',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('uma transação com campo biográfico de data está aberta', async () => {
        await intelligence.abrirDetalhesDaTransacaoPorTguid(tguid);
        await intelligence.validarDetalhesDaTransacaoCarregados(tguid);
      });
      await bdd.quando('abre a edição da transação', () => intelligence.abrirEdicaoAtual());
      await bdd.entao('o campo de data permanece preenchido com o valor atual', () =>
        intelligence.validarCampoDataPreenchidoNaEdicao(campoData));
    },
  );

  test(
    '[INT-40-UI-02] Mantém o valor do campo de data ao editar um perfil',
    {
      tag: [...TAGS, '@regression', '@int-40', '@introduced-in-1.8.2', '@editing', '@date', '@profile'],
    },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_40_PGUID);
      const campoData = envObrigatoria('INT_40_DATE_FIELD_LABEL');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-40',
        release: '1.8.2',
        objetivo: 'Preservar o valor atual do biográfico de data ao abrir a edição do perfil',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('um perfil com campo biográfico de data está aberto', () =>
        intelligence.abrirDetalhesDoPerfilPorPguid(pguid));
      await bdd.quando('abre a edição do perfil', () => intelligence.abrirEdicaoAtual());
      await bdd.entao('o campo de data permanece preenchido com o valor atual', () =>
        intelligence.validarCampoDataPreenchidoNaEdicao(campoData));
    },
  );

  test(
    '[INT-32-UI-01] Oferece calendário para editar campo biográfico de data',
    {
      tag: [...TAGS, '@regression', '@int-32', '@release-unassigned', '@editing', '@date'],
    },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_32_TGUID);
      const campoData = envObrigatoria('INT_32_DATE_FIELD_LABEL');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-32',
        release: 'UNASSIGNED',
        objetivo: 'Disponibilizar um controle de calendário ao editar biográfico do tipo data',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('uma transação com campo biográfico de data está aberta', async () => {
        await intelligence.abrirDetalhesDaTransacaoPorTguid(tguid);
        await intelligence.validarDetalhesDaTransacaoCarregados(tguid);
      });
      await bdd.quando('abre a edição da transação', () => intelligence.abrirEdicaoAtual());
      await bdd.entao('o campo de data usa um controle com calendário', () =>
        intelligence.validarCampoDataComCalendarioNaEdicao(campoData));
    },
  );

  test(
    '[INT-24-UI-01] Exibe histórico de perfis anteriores quando previousHistory existe',
    {
      tag: [...TAGS, '@regression', '@int-24', '@introduced-in-2.0.0', '@history', '@profile'],
    },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_24_PGUID);
      const pguidAnterior = envObrigatoria('INT_24_PREVIOUS_PGUID');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-24',
        release: '2.0.0',
        objetivo: 'Exibir os perfis anteriores que participaram da composição do PGUID atual',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.quando('abre um perfil cuja resposta possui previousHistory', () =>
        intelligence.abrirDetalhesDoPerfilPorPguid(pguid));
      await bdd.entao('o histórico de perfis anteriores exibe o PGUID esperado', () =>
        intelligence.validarHistoricoDePerfisAnteriores(pguidAnterior));
    },
  );

  test(
    '[INT-30-UI-01] Exporta o NIST da transação sem falha no navegador',
    {
      tag: [...TAGS, '@regression', '@int-30', '@introduced-in-2.0.0', '@export', '@nist'],
    },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_30_TGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-30',
        release: '2.0.0',
        objetivo: 'Provar que a ação de exportação NIST conclui e gera um download',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('uma transação exportável está aberta', async () => {
        await intelligence.abrirDetalhesDaTransacaoPorTguid(tguid);
        await intelligence.validarDetalhesDaTransacaoCarregados(tguid);
      });
      const download = await bdd.quando('aciona a exportação NIST', () =>
        intelligence.exportarNistDaTelaAtual());
      await bdd.entao('o navegador recebe um arquivo de exportação', () =>
        expect(download.suggestedFilename().trim().length).toBeGreaterThan(0));
    },
  );

  test(
    '[INT-30-NIST-02] Valida o tipo de imagem gravado no NIST exportado',
    {
      tag: [...TAGS, '@int-30', '@introduced-in-2.0.0', '@coverage-gap', '@export', '@nist'],
    },
    async ({}, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-30',
        release: '2.0.0',
        objetivo: 'Validar o tipo de imagem interno do arquivo NIST exportado',
      });
      await bdd.dado('que a Release Note exige exportar NIST com o tipo correto de imagem', async () => {
        throw new Error(
          'BLOQUEADO: INT-30 não informa no Jira qual tipo de imagem deve existir no NIST nem a regra de inspeção do arquivo.',
        );
      });
    },
  );
});
