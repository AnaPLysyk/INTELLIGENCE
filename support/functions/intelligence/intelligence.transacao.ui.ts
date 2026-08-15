import { expect, type Page } from '@playwright/test';

import { obterUrlIntelligence } from './intelligence.login.ui';

/**
 * Deep-link de TRANSACAO (chave TGUID) em modo somente leitura — R1 do INT-100.
 *
 * Confirmado ao vivo: TGUID e identidade direta e NAO dispara a busca
 * (/service/profile/list). A rota concreta de deep-link ainda nao foi observada
 * (exige massa real: um TGUID valido vindo do GBDS, hoje BLOCKED). Por isso a URL
 * e montada a partir de um template configuravel; quando a rota for capturada no
 * ambiente-alvo, basta preencher INT_100_TRANSACAO_URL_TEMPLATE no .env.local.
 *
 * Template aceita os placeholders {base} e {tguid}. Ex.:
 *   INT_100_TRANSACAO_URL_TEMPLATE={base}/transaction/{tguid}
 */
export function montarUrlTransacao(tguid: string, urlBase: string = obterUrlIntelligence()): string {
  const template = process.env.INT_100_TRANSACAO_URL_TEMPLATE?.trim();
  if (!template) {
    throw new Error(
      'Rota de deep-link de transacao ainda nao mapeada. Capture-a com um TGUID real e configure '
      + 'INT_100_TRANSACAO_URL_TEMPLATE no .env.local (placeholders {base} e {tguid}).',
    );
  }
  return template.replace('{base}', urlBase).replace('{tguid}', encodeURIComponent(tguid));
}

/** Abre a transacao por URL e confirma que renderizou (base para as assertivas de leitura). */
export async function abrirTransacaoPorDeepLink(
  page: Page,
  tguid: string,
  urlBase: string = obterUrlIntelligence(),
): Promise<void> {
  await page.goto(montarUrlTransacao(tguid, urlBase), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible({ timeout: 30_000 });
}

/**
 * Assertiva de que o deep-link resolveu a transacao. "N resultado(s) encontrado"
 * (com N digito) distingue o sucesso de "Nenhum resultado encontrado".
 */
export async function garantirTransacaoResolvida(page: Page): Promise<void> {
  await expect(
    page.locator('body'),
    'O deep-link por TGUID deve resolver a transacao (esperado "N resultado(s) encontrado").',
  ).toContainText(/\d+\s+resultados?\s+encontrado/i, { timeout: 30_000 });
}

/**
 * Assertiva NEGATIVA robusta: um usuario sem permissao de view-via-URL nao pode ter
 * a transacao exposta. Da tempo (10s) para o estado resolvido "N resultado(s)
 * encontrado" APARECER (a resolucao e assincrona); se aparecer, a transacao foi
 * exposta e o teste falha. Se nunca aparecer (negado/"Nenhum resultado"), passa.
 * Evita o falso-verde de assertar ausencia no estado transitorio de carregamento.
 */
export async function garantirTransacaoNaoExposta(page: Page): Promise<void> {
  let exposta = false;
  try {
    await page.getByText(/\d+\s+resultados?\s+encontrado/i).first().waitFor({ state: 'visible', timeout: 10_000 });
    exposta = true;
  } catch {
    exposta = false;
  }
  expect(exposta, 'Usuario sem permissao nao pode ter a transacao exposta pelo deep-link.').toBe(false);
}
