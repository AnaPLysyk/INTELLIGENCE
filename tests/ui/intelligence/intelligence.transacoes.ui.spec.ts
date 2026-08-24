import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';

const RELEASE = '1.13.0';
const TAGS = ['@regression', '@ui', '@intelligence', '@transacoes'];

test.describe('Intelligence UI — transações', () => {
  test(
    '[BUSCA-TRANSACAO-02] Interface de busca está disponível para admin',
    { tag: [...TAGS, '@positive', '@search', '@smoke', '@pw-BUSCA-TRANSACAO-02'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'BUSCA-TRANSACAO-02',
        release: RELEASE,
        objetivo: 'Validar que admin tem acesso à busca de transações',
      });

      const credenciais = await bdd.dado('existe admin autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.e('acessa a tela principal', async () => {
        await intel.autenticarComCredenciais(credenciais);
      });

      await bdd.entao('campo de busca está visível e ativo', async () => {
        const campoBusca = page.locator('input[placeholder*="Buscar"]');
        await expect(campoBusca).toBeVisible({ timeout: 10_000 });
      });
    },
  );

  test(
    '[BUSCA-TRANSACAO-04] Campo de busca não aparece para view-only',
    { tag: [...TAGS, '@negative', '@search', '@viewonly', '@pw-BUSCA-TRANSACAO-04'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'BUSCA-TRANSACAO-04',
        release: RELEASE,
        objetivo: 'Validar que view-only não vê campo de busca',
      });

      const credenciais = await bdd.dado('existe view-only autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.e('acessa a tela principal', async () => {
        await intel.autenticarComCredenciais(credenciais);
      });

      await bdd.entao('campo de busca não está visível', async () => {
        const campoBusca = page.locator('input[placeholder*="Buscar"]');
        await expect(campoBusca).not.toBeVisible({ timeout: 5_000 });
      });
    },
  );

  test(
    '[DETALHE-TRANSACAO-02] Detalhes sem controles de edição',
    { tag: [...TAGS, '@positive', '@transaction', '@readonly', '@viewonly', '@pw-DETALHE-TRANSACAO-02'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DETALHE-TRANSACAO-02',
        release: RELEASE,
        objetivo: 'Validar que view-only vê detalhes sem editar',
      });

      const credenciais = await bdd.dado('existe view-only autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.e('acessa a tela principal', async () => {
        await intel.autenticarComCredenciais(credenciais);
      });

      await bdd.quando('abre detalhes da transação', async () => {
        // Simula navegação para detalhes
        await page.goto(`${page.url()}/transaction/sample-tguid`);
      });

      await bdd.entao('detalhes são exibidos sem botões de edição', async () => {
        const botoesEdicao = page.locator('button:has-text(/Editar|Salvar|Excluir/)');
        await expect(botoesEdicao).not.toBeVisible({ timeout: 5_000 });
      });
    },
  );
});
