import { test } from '@playwright/test';

import { cenario } from '../../support/functions/cenario';
import { autenticarIntelligence } from '../../support/functions/intelligence/intelligence.login.ui';
import { abrirTransacaoPorDeepLink, garantirTransacaoNaoExposta } from '../../support/functions/intelligence/intelligence.transacao.ui';
import { garantirBuscaIndisponivel } from '../../support/functions/intelligence/intelligence.readonly.ui';
import { valorMassa } from '../../support/functions/massa/massa-busca';
import { bloquearTeste } from '../../support/functions/intelligence/intelligence.precondicoes';

const REL = '5.5.0.5062';
const URL_INTEL = process.env.INTELLIGENCE_UI_URL?.trim();
const VIEW_USER = process.env.INT_100_VIEWONLY_USERNAME?.trim();
const VIEW_PASS = process.env.INT_100_VIEWONLY_PASSWORD?.trim();
const SEM_PERM_USER = process.env.INT_100_SEM_PERMISSAO_USERNAME?.trim();
const SEM_PERM_PASS = process.env.INT_100_SEM_PERMISSAO_PASSWORD?.trim();
const FRONT_EM_QA = process.env.INT_100_FRONT_EM_QA === 'true';
const TGUID = valorMassa('TGUID', process.env.INT_100_TGUID);
const base = (): string => (URL_INTEL as string).replace(/\/$/, '');

test.describe('INTELLIGENCE | UI (negativo)', () => {
  test.setTimeout(120_000);

  test('@ui @intelligence @int-100 @search @viewonly @negative @release-5.5.0.5062 | INT-100 R3 - busca indisponivel no modo view-via-URL', async ({ page }, testInfo) => {
    if (!FRONT_EM_QA || !URL_INTEL || !VIEW_USER || !VIEW_PASS || !TGUID) {
      bloquearTeste(testInfo, 'requer INT_100_FRONT_EM_QA=true, URL, usuário view-only e INT_100_TGUID.');
    }
    const passo = await cenario(testInfo, { ticket: 'INT-100', release: REL, objetivo: 'R3: no modo view-via-URL a busca nao esta disponivel' });

    await passo.dado('um usuario view-only autenticado', () => autenticarIntelligence(page, { usuario: VIEW_USER, senha: VIEW_PASS }, base()));
    await passo.quando('abre a transacao pelo deep-link (TGUID)', () => abrirTransacaoPorDeepLink(page, TGUID, base()));
    await passo.entao('a busca (dropdown Chave + Pesquisar) esta indisponivel', () => garantirBuscaIndisponivel(page));
  });

  test('@ui @intelligence @int-100 @deeplink @transaction @security @negative @release-5.5.0.5062 | INT-100 I8 - URL de transacao sem permissao adequada e negada', async ({ page }, testInfo) => {
    if (!FRONT_EM_QA || !URL_INTEL || !SEM_PERM_USER || !SEM_PERM_PASS || !TGUID) {
      bloquearTeste(testInfo, 'requer INT_100_FRONT_EM_QA=true, URL, usuário sem permissão e INT_100_TGUID.');
    }
    const passo = await cenario(testInfo, { ticket: 'INT-100', release: REL, objetivo: 'I8: URL de transacao sem permissao adequada e negada' });

    await passo.dado('um usuario SEM permissao view-via-URL autenticado', () => autenticarIntelligence(page, { usuario: SEM_PERM_USER, senha: SEM_PERM_PASS }, base()));
    await passo.quando('abre o proprio deep-link da transacao', () => abrirTransacaoPorDeepLink(page, TGUID, base()));
    await passo.entao('a transacao NAO e exposta', () => garantirTransacaoNaoExposta(page));
  });
});
