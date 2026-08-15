import { expect, type Locator, type Page } from '@playwright/test';

import { seletoresIntelligence } from './intelligence.login.ui';

/**
 * Mecanismo de busca do Intelligence (a "ponte" que o modo view-via-URL do
 * INT-100 NAO pode usar). Contrato CONFIRMADO ao vivo em 2026-08-13:
 *   POST {service}/profile/list/count  e  POST {service}/profile/list?first=0&size=20
 *   corpo: { name, value, kind }, onde `kind` varia por chave:
 *     - cpf        -> kind "KEY"
 *     - Id externo -> kind "EXTERNAL_ID"
 *   (o INT-98 documentava o contrato antigo /gbds/v2/*; a UI atual normaliza
 *    tudo em /service/profile/list com o discriminador `kind`.)
 *
 * TGUID e PGUID NAO disparam profile/list: sao identidade direta (deep-link /
 * navegacao). Por isso a busca por chave e a "ponte" que o view-via-URL bloqueia,
 * enquanto TGUID/PGUID sao o acesso direto permitido. Ver intelligence.transacao/perfil.
 */

export const CONTRATO_BUSCA = {
  endpointCount: '/service/profile/list/count',
  endpointList: '/service/profile/list',
  kindPorChave: { cpf: 'KEY', 'EXTERNAL.ID': 'EXTERNAL_ID' } as Record<string, string>,
} as const;

/** Chaves de identidade direta (deep-link, NAO passam pela busca). */
export const CHAVES_DEEP_LINK = { transacao: 'TGUID', perfil: 'PGUID' } as const;

export type OpcaoChave = { value: string; label: string };

/** Localiza o <select> "Chave" da home. */
export function localizarSelectChave(page: Page): Locator {
  return page.locator(seletoresIntelligence.busca.chave).first();
}

/**
 * Le as opcoes REAIS do dropdown (value + label) direto do componente, sem
 * hardcodar a partir da screenshot. O ambiente confirmou, entre outras:
 * PGUID/PGUID, TGUID/TGUID, Id externo/EXTERNAL.ID, cpf/cpf, Data de Nascimento/birthdate,
 * Nome/name, cib_exid/cib. Sempre reler no ambiente-alvo.
 */
export async function lerOpcoesChave(page: Page): Promise<OpcaoChave[]> {
  const select = localizarSelectChave(page);
  await expect(select).toBeVisible({ timeout: 30_000 });
  return select.locator('option').evaluateAll((opcoes) =>
    opcoes
      .map((o) => ({ value: (o as HTMLOptionElement).value, label: (o.textContent ?? '').trim() }))
      .filter((o) => o.value && !/selecionar/i.test(o.label)));
}

/** A busca esta disponivel para este usuario? (form presente e habilitado). */
export async function buscaEstaDisponivel(page: Page): Promise<boolean> {
  const select = localizarSelectChave(page);
  const pesquisar = page.getByRole('button', { name: seletoresIntelligence.busca.pesquisar });
  if (await select.count() === 0 || await pesquisar.count() === 0) return false;
  return (await select.isEnabled().catch(() => false)) && (await pesquisar.isEnabled().catch(() => false));
}

/**
 * Seleciona uma chave (pelo value real, ex.: 'cpf', 'EXTERNAL.ID') e dispara a
 * busca. Baseline de acesso completo (a "ponte" funcionando).
 */
export async function buscarPorChave(page: Page, chaveValue: string, valor: string): Promise<void> {
  await localizarSelectChave(page).selectOption(chaveValue);
  await page.locator(seletoresIntelligence.busca.valor).last().fill(valor);
  await page.getByRole('button', { name: seletoresIntelligence.busca.pesquisar }).click();
}
