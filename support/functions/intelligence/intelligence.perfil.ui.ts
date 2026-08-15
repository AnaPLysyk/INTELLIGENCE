import { expect, type Page } from '@playwright/test';

import { obterUrlIntelligence } from './intelligence.login.ui';

/**
 * Deep-link de PERFIL (chave PGUID) em modo somente leitura — R2 do INT-100.
 *
 * Como o TGUID, o PGUID e identidade direta (nao passa pela busca). A rota de
 * deep-link ainda nao foi observada (exige um PGUID real do GBDS, hoje BLOCKED);
 * a URL vem de um template configuravel. Quando a rota for capturada, preencha
 * INT_100_PERFIL_URL_TEMPLATE no .env.local (placeholders {base} e {pguid}). Ex.:
 *   INT_100_PERFIL_URL_TEMPLATE={base}/profile/{pguid}
 */
export function montarUrlPerfil(pguid: string, urlBase: string = obterUrlIntelligence()): string {
  const template = process.env.INT_100_PERFIL_URL_TEMPLATE?.trim();
  if (!template) {
    throw new Error(
      'Rota de deep-link de perfil ainda nao mapeada. Capture-a com um PGUID real e configure '
      + 'INT_100_PERFIL_URL_TEMPLATE no .env.local (placeholders {base} e {pguid}).',
    );
  }
  return template.replace('{base}', urlBase).replace('{pguid}', encodeURIComponent(pguid));
}

/** Abre o perfil por URL e confirma que renderizou (base para as assertivas de leitura). */
export async function abrirPerfilPorDeepLink(
  page: Page,
  pguid: string,
  urlBase: string = obterUrlIntelligence(),
): Promise<void> {
  await page.goto(montarUrlPerfil(pguid, urlBase), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible({ timeout: 30_000 });
}
