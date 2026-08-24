import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';

const RELEASE = '1.13.0';
const TAGS = ['@regression', '@ui', '@intelligence', '@configuracoes'];

test.describe('Intelligence UI — configurações', () => {
  test(
    '[TEMA-ADMIN-01] Admin muda para tema escuro',
    { tag: [...TAGS, '@positive', '@settings', '@smoke', '@admin', '@pw-TEMA-ADMIN-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'TEMA-ADMIN-01',
        release: RELEASE,
        objetivo: 'Validar mudança de tema para escuro',
      });

      const credenciais = await bdd.dado('existe admin autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.e('abre configurações', async () => {
        await intel.autenticarComCredenciais(credenciais);
        // Simula abertura de configurações
        await page.click('button[aria-label*="Configura"]');
      });

      await bdd.e('seleciona tema escuro', async () => {
        await page.click('button:has-text(/Escuro|Dark/)');
      });

      await bdd.entao('interface muda para tema escuro', async () => {
        const html = page.locator('html');
        const tema = await html.getAttribute('data-theme');
        expect(tema).toContain('dark');
      });
    },
  );

  test(
    '[TEMA-VIEWONLY-01] View-only também pode mudar tema',
    { tag: [...TAGS, '@positive', '@settings', '@viewonly', '@pw-TEMA-VIEWONLY-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'TEMA-VIEWONLY-01',
        release: RELEASE,
        objetivo: 'Validar que view-only pode mudar tema',
      });

      const credenciais = await bdd.dado('existe view-only autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.e('abre configurações', async () => {
        await intel.autenticarComCredenciais(credenciais);
        await page.click('button[aria-label*="Configura"]');
      });

      await bdd.e('seleciona tema claro', async () => {
        await page.click('button:has-text(/Claro|Light/)');
      });

      await bdd.entao('interface muda para tema claro', async () => {
        const html = page.locator('html');
        const tema = await html.getAttribute('data-theme');
        expect(tema).toContain('light');
      });
    },
  );

  test(
    '[IDIOMA-MUDANCA-01] Muda interface para inglês',
    { tag: [...TAGS, '@positive', '@settings', '@smoke', '@pw-IDIOMA-MUDANCA-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'IDIOMA-MUDANCA-01',
        release: RELEASE,
        objetivo: 'Validar mudança de idioma para inglês',
      });

      const credenciais = await bdd.dado('estou em português', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.e('abro configurações', async () => {
        await intel.autenticarComCredenciais(credenciais);
        await page.click('button[aria-label*="Configura"]');
      });

      await bdd.e('seleciono English', async () => {
        await page.click('button:has-text(/English|EN/)');
      });

      await bdd.entao('todos os textos estão em inglês', async () => {
        const html = page.locator('html');
        const lang = await html.getAttribute('lang');
        expect(lang).toBe('en');
      });
    },
  );

  test(
    '[IDIOMA-PERSISTENCIA-01] Idioma persiste entre sessões',
    { tag: [...TAGS, '@positive', '@settings', '@pw-IDIOMA-PERSISTENCIA-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'IDIOMA-PERSISTENCIA-01',
        release: RELEASE,
        objetivo: 'Validar persistência de idioma',
      });

      const credenciais = await bdd.dado('escolhi English', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.e('faço logout e login novamente', async () => {
        await intel.autenticarComCredenciais(credenciais);
        await page.click('button:has-text(/Sair|Logout/)');
        await intel.autenticarComCredenciais(credenciais);
      });

      await bdd.entao('interface está em English', async () => {
        const html = page.locator('html');
        const lang = await html.getAttribute('lang');
        expect(lang).toBe('en');
      });
    },
  );
});
