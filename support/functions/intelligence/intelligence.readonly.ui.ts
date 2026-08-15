import { expect, type Page } from '@playwright/test';

import { buscaEstaDisponivel } from './intelligence.busca.ui';

/**
 * Assertivas do modo SOMENTE LEITURA via URL (INT-100).
 *   - garantirBuscaIndisponivel: R3 — a "ponte" de busca nao pode existir/estar ativa.
 *   - garantirSemControlesDeEscrita: R1/R2 — a tela nao oferece acoes de mutacao.
 *
 * HIPOTESE (a confirmar quando o front chegar a QA): a busca e gated pela permissao
 * `intelligence_list_regular`; o view-via-URL concede `intelligence_user` sem ela.
 */

/** R3: no modo view-via-URL, a busca do Intelligence nao deve estar disponivel. */
export async function garantirBuscaIndisponivel(page: Page): Promise<void> {
  expect(
    await buscaEstaDisponivel(page),
    'R3: no modo view-via-URL a busca (dropdown Chave + Pesquisar) deve estar ausente ou desabilitada.',
  ).toBe(false);
}

/**
 * R1/R2: modo somente leitura nao oferece controles de escrita/mutacao.
 * Rotulos tipicos de acao de escrita no dominio (ajustar conforme a tela real do INT-100).
 */
const ROTULOS_ESCRITA = [/editar/i, /salvar/i, /excluir/i, /tratar/i, /exportar/i, /enviar/i, /confirmar/i];

export async function garantirSemControlesDeEscrita(page: Page): Promise<void> {
  for (const rotulo of ROTULOS_ESCRITA) {
    const botao = page.getByRole('button', { name: rotulo });
    if (await botao.count() > 0) {
      expect(
        await botao.first().isDisabled().catch(() => true),
        `R1/R2: controle de escrita "${rotulo}" nao pode estar habilitado no modo somente leitura.`,
      ).toBe(true);
    }
  }
}
