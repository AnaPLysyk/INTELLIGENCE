import { expect, type Locator, type Page } from '@playwright/test';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

type CandidatoHistorico = {
  pguid: string;
  tag: string;
  role: string;
  href: string;
  cursor: string;
};

export class ProfileHistoryPage {
  constructor(private readonly page: Page) {}

  async navegarParaPerfilAnteriorNoHistorico(pguidAtual: string): Promise<string> {
    const corpo = this.page.locator('body');
    await expect(
      corpo,
      'O perfil com historico deve exibir o bloco Historico de perfis anteriores.',
    ).toContainText(/hist[oó]rico de perfis anteriores/i, { timeout: 30_000 });

    const atual = pguidAtual.toUpperCase();
    const candidatos = await this.page.locator('body *').evaluateAll((elementos, pguidAtualNormalizado) => {
      const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig;
      const encontrados: CandidatoHistorico[] = [];

      for (const elemento of elementos) {
        const texto = (elemento.textContent || '').trim();
        if (!texto) continue;

        const estilo = window.getComputedStyle(elemento);
        const retangulo = elemento.getBoundingClientRect();
        if (
          estilo.display === 'none'
          || estilo.visibility === 'hidden'
          || Number(estilo.opacity || '1') === 0
          || retangulo.width === 0
          || retangulo.height === 0
        ) continue;

        const ids = Array.from(texto.matchAll(uuid)).map((match) => match[0].toUpperCase());
        for (const pguid of ids) {
          if (pguid === pguidAtualNormalizado) continue;

          const filhoComMesmoPguid = Array.from(elemento.children)
            .some((filho) => (filho.textContent || '').toUpperCase().includes(pguid));
          if (filhoComMesmoPguid) continue;

          encontrados.push({
            pguid,
            tag: elemento.tagName.toLowerCase(),
            role: elemento.getAttribute('role') || '',
            href: elemento.getAttribute('href') || '',
            cursor: estilo.cursor || '',
          });
        }
      }

      return encontrados.filter(
        (item, indice, lista) => lista.findIndex((outro) => outro.pguid === item.pguid) === indice,
      ).slice(0, 20);
    }, atual);

    const candidato = candidatos[0];
    if (!candidato) {
      throw new Error(
        'BLOQUEADO: o bloco Historico de perfis anteriores foi exibido, '
        + 'mas nenhum PGUID anterior visivel foi identificado na UI.',
      );
    }

    const porAcao = this.page
      .locator('a, button, [role="button"]')
      .filter({ hasText: candidato.pguid })
      .first();
    const porTexto = this.page.getByText(new RegExp(candidato.pguid, 'i')).first();
    const acionador: Locator = await porAcao.isVisible().catch(() => false) ? porAcao : porTexto;

    const urlAntes = decodeURIComponent(this.page.url()).toUpperCase();
    try {
      await acionador.click({ timeout: 10_000 });
    } catch (error_) {
      const mensagem = error_ instanceof Error ? error_.message.split('\n')[0] : String(error_);
      throw new Error(
        `BLOQUEADO: o historico exibe o PGUID ${candidato.pguid}, mas o item nao pôde ser acionado. `
        + `elemento=${candidato.tag}|role=${candidato.role || '-'}|href=${candidato.href || '-'}|cursor=${candidato.cursor || '-'}|erro=${mensagem}`,
      );
    }

    const navegou = await expect.poll(
      () => decodeURIComponent(this.page.url()).toUpperCase(),
      {
        message: 'Selecionar um item do historico deve navegar para o PGUID escolhido.',
        timeout: 15_000,
      },
    ).toContain(`/PERSON/${candidato.pguid}`)
      .then(() => true)
      .catch(() => false);

    if (!navegou) {
      const urlDepois = decodeURIComponent(this.page.url()).toUpperCase();
      throw new Error(
        `BLOQUEADO: o historico exibe o PGUID ${candidato.pguid}, o clique foi executado, `
        + `mas nao houve navegacao para o perfil anterior. antes=${urlAntes}|depois=${urlDepois}`,
      );
    }

    await expect(
      this.page.locator('body'),
      'O perfil selecionado no historico deve exibir o PGUID navegado.',
    ).toContainText(candidato.pguid, { ignoreCase: true, timeout: 30_000 });
    await expect(
      this.page.locator('body'),
      'Um perfil selecionado no historico nao deve cair em estado de recurso inexistente.',
    ).not.toContainText(/p[aá]gina n[aã]o encontrada|nenhum resultado encontrado|not found/i);

    return candidato.pguid;
  }
}
