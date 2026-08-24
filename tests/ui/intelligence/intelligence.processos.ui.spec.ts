import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';

const RELEASE = '1.13.0';

test.describe('Intelligence UI — processos criminais', () => {
  test(
    '[CRIMINAL-BUSCA-02] Interface de busca de criminais disponível',
    { tag: ['@regression', '@ui', '@intelligence', '@positive', '@processo', '@investigador', '@smoke', '@pw-CRIMINAL-BUSCA-02'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'CRIMINAL-BUSCA-02',
        release: RELEASE,
        objetivo: 'Validar interface de busca de processos criminais',
      });

      const credenciais = await bdd.dado('existe investigador autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.quando('acessa a seção de processos criminais', async () => {
        await intel.autenticarComCredenciais(credenciais);
        await page.goto(`${page.url()}/processos/criminais`);
      });

      await bdd.entao('busca e filtros estão disponíveis', async () => {
        const campoBusca = page.locator('input[placeholder*="processo"]');
        const filtros = page.locator('button:has-text(/Filtro|Filter/)');
        await expect(campoBusca).toBeVisible();
        await expect(filtros).toBeVisible();
      });
    },
  );

  test(
    '[CRIMINAL-VISUALIZA-01] Gestor vê processos sem editar',
    { tag: ['@regression', '@ui', '@intelligence', '@positive', '@processo', '@gestor', '@readonly', '@pw-CRIMINAL-VISUALIZA-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'CRIMINAL-VISUALIZA-01',
        release: RELEASE,
        objetivo: 'Validar visualização sem edição para gestor',
      });

      const credenciais = await bdd.dado('existe gestor autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.quando('abre processo criminal', async () => {
        await intel.autenticarComCredenciais(credenciais);
        await page.goto(`${page.url()}/processos/criminais/processo-123`);
      });

      await bdd.entao('visualiza dados sem controles de escrita', async () => {
        const botoesEdicao = page.locator('button:has-text(/Editar|Salvar|Excluir/)');
        await expect(botoesEdicao).not.toBeVisible();
      });
    },
  );

  test(
    '[CRIMINAL-ACESSO-NEGADO-01] Sem permissão bloqueia acesso',
    { tag: ['@regression', '@ui', '@intelligence', '@negative', '@processo', '@no-access', '@security', '@pw-CRIMINAL-ACESSO-NEGADO-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'CRIMINAL-ACESSO-NEGADO-01',
        release: RELEASE,
        objetivo: 'Validar bloqueio de acesso sem permissão',
      });

      const credenciais = await bdd.dado('existe usuário sem permissão', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'sem-permissao'),
      );

      const intel = new IntelligencePage(page);

      await bdd.quando('tenta acessar processos criminais', async () => {
        try {
          await intel.autenticarComCredenciais(credenciais);
        } catch {
          // Autenticação já falha para sem-permissao
        }
      });

      await bdd.entao('é redirecionado para tela informativa', async () => {
        const telaInformativa = page.locator('text=/Acesso negado|Não autorizado/i');
        await expect(telaInformativa).toBeVisible({ timeout: 10_000 });
      });
    },
  );
});

test.describe('Intelligence UI — processos necros', () => {
  test(
    '[NECRO-BUSCA-02] Interface de busca de necros disponível',
    { tag: ['@regression', '@ui', '@intelligence', '@positive', '@processo', '@investigador', '@smoke', '@pw-NECRO-BUSCA-02'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'NECRO-BUSCA-02',
        release: RELEASE,
        objetivo: 'Validar interface de busca de processos necros',
      });

      const credenciais = await bdd.dado('existe investigador autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.quando('acessa a seção de processos necros', async () => {
        await intel.autenticarComCredenciais(credenciais);
        await page.goto(`${page.url()}/processos/necros`);
      });

      await bdd.entao('busca e filtros estão disponíveis', async () => {
        const campoBusca = page.locator('input[placeholder*="processo"]');
        const filtros = page.locator('button:has-text(/Filtro|Filter/)');
        await expect(campoBusca).toBeVisible();
        await expect(filtros).toBeVisible();
      });
    },
  );

  test(
    '[NECRO-VISUALIZA-01] Consultor vê processos sem editar',
    { tag: ['@regression', '@ui', '@intelligence', '@positive', '@processo', '@consultor', '@readonly', '@pw-NECRO-VISUALIZA-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'NECRO-VISUALIZA-01',
        release: RELEASE,
        objetivo: 'Validar visualização sem edição para consultor',
      });

      const credenciais = await bdd.dado('existe consultor autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.quando('abre processo necro', async () => {
        await intel.autenticarComCredenciais(credenciais);
        await page.goto(`${page.url()}/processos/necros/processo-456`);
      });

      await bdd.entao('visualiza dados sem controles de escrita', async () => {
        const botoesEdicao = page.locator('button:has-text(/Editar|Salvar|Excluir/)');
        await expect(botoesEdicao).not.toBeVisible();
      });
    },
  );

  test(
    '[NECRO-ACESSO-NEGADO-01] Sem permissão bloqueia acesso',
    { tag: ['@regression', '@ui', '@intelligence', '@negative', '@processo', '@no-access', '@security', '@pw-NECRO-ACESSO-NEGADO-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'NECRO-ACESSO-NEGADO-01',
        release: RELEASE,
        objetivo: 'Validar bloqueio de acesso sem permissão',
      });

      const credenciais = await bdd.dado('existe usuário sem permissão', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'sem-permissao'),
      );

      const intel = new IntelligencePage(page);

      await bdd.quando('tenta acessar processos necros', async () => {
        try {
          await intel.autenticarComCredenciais(credenciais);
        } catch {
          // Autenticação já falha para sem-permissao
        }
      });

      await bdd.entao('é redirecionado para tela informativa', async () => {
        const telaInformativa = page.locator('text=/Acesso negado|Não autorizado/i');
        await expect(telaInformativa).toBeVisible({ timeout: 10_000 });
      });
    },
  );
});
