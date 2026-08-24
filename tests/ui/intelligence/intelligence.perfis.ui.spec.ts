import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';
import { obterValorObrigatorioDaMassa } from '../../../support/massas/dados/intelligence.busca.massa';

const RELEASE = '1.13.0';
const TAGS = ['@regression', '@ui', '@intelligence', '@perfis'];

test.describe('Intelligence UI — perfis', () => {
  test(
    '[CONSULTA-PERFIL-UI-01] Abre perfil pelo deep-link',
    { tag: [...TAGS, '@positive', '@profile', '@deeplink', '@pw-CONSULTA-PERFIL-UI-01'] },
    async ({ page, request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'CONSULTA-PERFIL-UI-01',
        release: RELEASE,
        objetivo: 'Validar abertura de perfil via deep-link',
      });

      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);

      const credenciais = await bdd.dado('existe admin autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const intel = new IntelligencePage(page);

      await bdd.e('acessa a aplicação', async () => {
        await intel.autenticarComCredenciais(credenciais);
      });

      await bdd.quando('abre perfil pelo PGUID', async () => {
        await page.goto(`${page.url()}/profile/${pguid}`);
      });

      await bdd.entao('perfil é exibido', async () => {
        const titulo = page.locator('h1:has-text("Perfil")');
        await expect(titulo).toBeVisible({ timeout: 10_000 });
      });
    },
  );
});
