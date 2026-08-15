import { expect, type Page } from '@playwright/test';

/**
 * Acesso ao GBS Intelligence (frente INT-100). Fatos CONFIRMADOS ao vivo em
 * 2026-08-13 (login com o admin do SMART; ambiente GBDS 5.4.0 build 5061):
 *   - Home:  {base}/gbs-intelligence-server/react/
 *   - Login: POST {base}/gbs-intelligence-server/service/session -> 201
 *            { status:'AUTHENTICATION_OK', token } (JWT HS512 com permissions[]).
 *   - Campos: input[name=username], input[name=password], botao "Acessar".
 *   - Busca:  dropdown "Chave" e <select> NATIVO (selectOption funciona, desde que
 *             se espere o login concluir) + campo "Valor" + botao "Pesquisar".
 *
 * INT-100 (Em andamento): o modo view-via-URL somente leitura ainda nao esta no
 * build. Este helper cobre o ACESSO COMPLETO (baseline, caso I5).
 */

/** Resolve a URL da home do Intelligence a partir do .env.local. */
export function obterUrlIntelligence(): string {
  const bruta = process.env.INTELLIGENCE_UI_URL?.trim();
  if (!bruta) {
    throw new Error('Configure INTELLIGENCE_UI_URL no .env.local (ex.: http://172.16.1.146:8122/gbs-intelligence-server/react/).');
  }
  return bruta.replace(/\/$/, '');
}

/** Seletores confirmados ao vivo. */
export const seletoresIntelligence = {
  login: {
    usuario: 'input[name="username"]',
    senha: 'input[name="password"]',
    acessar: /acessar/i,
  },
  busca: {
    chave: 'select', // <select> nativo; use selectOption com o value real (ver chavesBuscaIntelligence).
    valor: 'input[type="text"]',
    pesquisar: /pesquisar/i,
  },
} as const;

export type CredenciaisIntelligence = {
  usuario: string;
  senha: string;
};

/**
 * Autentica no Intelligence e aguarda a home com o formulario de busca.
 * Baseline de ACESSO COMPLETO (usuario com a busca disponivel).
 */
export async function autenticarIntelligence(
  page: Page,
  credenciais: CredenciaisIntelligence,
  urlBase: string = obterUrlIntelligence(),
): Promise<void> {
  await page.goto(`${urlBase}/`, { waitUntil: 'domcontentloaded' });

  await expect(page.locator(seletoresIntelligence.login.usuario)).toBeVisible({ timeout: 30_000 });
  await page.locator(seletoresIntelligence.login.usuario).fill(credenciais.usuario);
  await page.locator(seletoresIntelligence.login.senha).fill(credenciais.senha);
  await page.getByRole('button', { name: seletoresIntelligence.login.acessar }).click();

  // A home so renderiza pos-login; o botao "Pesquisar" confirma o acesso completo.
  await expect(page.getByRole('button', { name: seletoresIntelligence.busca.pesquisar }))
    .toBeVisible({ timeout: 30_000 });
}
