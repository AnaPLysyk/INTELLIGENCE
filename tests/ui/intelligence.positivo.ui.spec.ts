import { expect, test } from '@playwright/test';

import { cenario } from '../../support/functions/cenario';
import { autenticarIntelligence } from '../../support/functions/intelligence/intelligence.login.ui';
import { buscaEstaDisponivel } from '../../support/functions/intelligence/intelligence.busca.ui';
import { abrirTransacaoPorDeepLink, garantirTransacaoResolvida } from '../../support/functions/intelligence/intelligence.transacao.ui';
import { abrirPerfilPorDeepLink } from '../../support/functions/intelligence/intelligence.perfil.ui';
import { garantirSemControlesDeEscrita } from '../../support/functions/intelligence/intelligence.readonly.ui';
import { valorMassa } from '../../support/functions/massa/massa-busca';
import { bloquearTeste } from '../../support/functions/intelligence/intelligence.precondicoes';

const REL = '5.5.0.5062';
const URL_INTEL = process.env.INTELLIGENCE_UI_URL?.trim();
const ADMIN_USER = process.env.INTELLIGENCE_ADMIN_USERNAME?.trim() || process.env.SMART_UI_USERNAME?.trim();
const ADMIN_PASS = process.env.INTELLIGENCE_ADMIN_PASSWORD?.trim() || process.env.SMART_UI_PASSWORD?.trim();
const VIEW_USER = process.env.INT_100_VIEWONLY_USERNAME?.trim();
const VIEW_PASS = process.env.INT_100_VIEWONLY_PASSWORD?.trim();
const FRONT_EM_QA = process.env.INT_100_FRONT_EM_QA === 'true';
const TGUID = valorMassa('TGUID', process.env.INT_100_TGUID);
const PGUID = valorMassa('PGUID', process.env.INT_100_PGUID);
const base = (): string => (URL_INTEL as string).replace(/\/$/, '');

test.describe('INTELLIGENCE | UI (positivo)', () => {
  test.setTimeout(120_000);

  test('@ui @intelligence @int-100 @search @admin @positive @release-5.5.0.5062 | INT-100 I5 - acesso completo mantem a busca disponivel', async ({ page }, testInfo) => {
    if (!URL_INTEL || !ADMIN_USER || !ADMIN_PASS) {
      bloquearTeste(testInfo, 'configure INTELLIGENCE_UI_URL e as credenciais de acesso completo.');
    }
    const passo = await cenario(testInfo, { ticket: 'INT-100', release: REL, objetivo: 'I5: acesso completo mantem a busca disponivel' });

    await passo.dado('um usuario com acesso completo autenticado', () => autenticarIntelligence(page, { usuario: ADMIN_USER, senha: ADMIN_PASS }, base()));
    await passo.entao('a busca (dropdown Chave + Pesquisar) esta disponivel', async () => {
      expect(await buscaEstaDisponivel(page), 'Acesso completo deve manter a busca disponivel (R4/I5).').toBe(true);
    });
  });

  test('@ui @intelligence @int-100 @deeplink @transaction @admin @positive @release-5.5.0.5062 | INT-100 baseline - deep-link de transacao (TGUID) resolve em acesso completo', async ({ page }, testInfo) => {
    const TEMPLATE = process.env.INT_100_TRANSACAO_URL_TEMPLATE?.trim();
    if (!URL_INTEL || !ADMIN_USER || !ADMIN_PASS || !TGUID || !TEMPLATE) {
      bloquearTeste(testInfo, 'configure INTELLIGENCE_UI_URL, credenciais de acesso completo, INT_100_TGUID e INT_100_TRANSACAO_URL_TEMPLATE.');
    }
    const passo = await cenario(testInfo, { ticket: 'INT-100', release: REL, objetivo: 'Baseline: deep-link de transacao por TGUID resolve' });

    await passo.dado('um usuario com acesso completo autenticado', () => autenticarIntelligence(page, { usuario: ADMIN_USER, senha: ADMIN_PASS }, base()));
    await passo.quando('abre a transacao pelo deep-link (TGUID)', () => abrirTransacaoPorDeepLink(page, TGUID, base()));
    await passo.entao('a transacao e resolvida', () => garantirTransacaoResolvida(page));
  });

  test('@ui @intelligence @int-100 @deeplink @transaction @readonly @viewonly @positive @release-5.5.0.5062 | INT-100 I1 - visualizar transacao por URL em modo somente leitura', async ({ page }, testInfo) => {
    if (!FRONT_EM_QA || !URL_INTEL || !VIEW_USER || !VIEW_PASS || !TGUID) {
      bloquearTeste(testInfo, 'requer INT_100_FRONT_EM_QA=true, URL, usuário view-only e INT_100_TGUID.');
    }
    const passo = await cenario(testInfo, { ticket: 'INT-100', release: REL, objetivo: 'I1: visualizar transacao por URL em modo somente leitura' });

    await passo.dado('um usuario view-only autenticado', () => autenticarIntelligence(page, { usuario: VIEW_USER, senha: VIEW_PASS }, base()));
    await passo.quando('abre a transacao pelo deep-link (TGUID)', () => abrirTransacaoPorDeepLink(page, TGUID, base()));
    await passo.entao('nao ha controles de escrita disponiveis', () => garantirSemControlesDeEscrita(page));
  });

  test('@ui @intelligence @int-100 @deeplink @profile @readonly @viewonly @positive @release-5.5.0.5062 | INT-100 I2 - visualizar perfil por URL em modo somente leitura', async ({ page }, testInfo) => {
    if (!FRONT_EM_QA || !URL_INTEL || !VIEW_USER || !VIEW_PASS || !PGUID) {
      bloquearTeste(testInfo, 'requer INT_100_FRONT_EM_QA=true, URL, usuário view-only e INT_100_PGUID.');
    }
    const passo = await cenario(testInfo, { ticket: 'INT-100', release: REL, objetivo: 'I2: visualizar perfil por URL em modo somente leitura' });

    await passo.dado('um usuario view-only autenticado', () => autenticarIntelligence(page, { usuario: VIEW_USER, senha: VIEW_PASS }, base()));
    await passo.quando('abre o perfil pelo deep-link (PGUID)', () => abrirPerfilPorDeepLink(page, PGUID, base()));
    await passo.entao('nao ha controles de escrita disponiveis', () => garantirSemControlesDeEscrita(page));
  });
});
