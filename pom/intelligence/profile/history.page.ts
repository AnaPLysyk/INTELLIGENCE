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

  private async escopoHistorico(pguidAtual: string): Promise<Locator> {
    const titulo = this.page.getByText(/hist[oó]rico de perfis anteriores/i).first();
    await expect(
      titulo,
      'O perfil com historico deve exibir o bloco Historico de perfis anteriores.',
    ).toBeVisible({ timeout: 30_000 });

    const atual = pguidAtual.toUpperCase();
    let escopo = titulo.locator('xpath=..');

    for (let nivel = 0; nivel < 7; nivel += 1) {
      const texto = (await escopo.textContent().catch(() => '') || '').toUpperCase();
      const uuids = texto.match(new RegExp(UUID.source, 'ig')) ?? [];
      const anteriores = uuids.filter((id) => id.toUpperCase() !== atual);
      if (anteriores.length > 0) return escopo;
      escopo = escopo.locator('xpath=..');
    }

    throw new Error(
      'BLOQUEADO: o bloco Historico de perfis anteriores foi exibido, '
      + 'mas nenhum PGUID anterior foi encontrado no seu proprio conteudo.',
    );
  }

  async navegarParaPerfilAnteriorNoHistorico(pguidAtual: string): Promise<string> {
    const escopo = await this.escopoHistorico(pguidAtual);
    const atual = pguidAtual.toUpperCase();

    const candidatos = await escopo.locator('*').evaluateAll((elementos, pguidAtualNormalizado) => {
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
        + 'mas nenhum PGUID anterior visivel foi identificado dentro dele.',
      );
    }

    const porAcao = escopo
      .locator('a, button, [role="button"]')
      .filter({ hasText: candidato.pguid })
      .first();
    const porTexto = escopo.getByText(new RegExp(candidato.pguid, 'i')).first();
    const acionador: Locator = await porAcao.isVisible().catch(() => false) ? porAcao : porTexto;

    const diagnostico = await acionador.evaluate((elemento) => {
      const estilo = window.getComputedStyle(elemento);
      const pai = elemento.parentElement;
      return {
        tag: elemento.tagName.toLowerCase(),
        role: elemento.getAttribute('role') || '',
        href: elemento.getAttribute('href') || '',
        cursor: estilo.cursor || '',
        parentTag: pai?.tagName.toLowerCase() || '',
        parentRole: pai?.getAttribute('role') || '',
        parentCursor: pai ? window.getComputedStyle(pai).cursor || '' : '',
      };
    }).catch(() => ({
      tag: candidato.tag,
      role: candidato.role,
      href: candidato.href,
      cursor: candidato.cursor,
      parentTag: '',
      parentRole: '',
      parentCursor: '',
    }));

    const urlAntes = decodeURIComponent(this.page.url()).toUpperCase();
    try {
      await acionador.click({ timeout: 10_000 });
    } catch (error_) {
      const mensagem = error_ instanceof Error ? error_.message.split('\n')[0] : String(error_);
      throw new Error(
        `BLOQUEADO: o historico exibe o PGUID ${candidato.pguid}, mas o item nao pôde ser acionado. `
        + `elemento=${diagnostico.tag}|role=${diagnostico.role || '-'}|href=${diagnostico.href || '-'}|cursor=${diagnostico.cursor || '-'}`
        + `|pai=${diagnostico.parentTag || '-'}|paiRole=${diagnostico.parentRole || '-'}|paiCursor=${diagnostico.parentCursor || '-'}|erro=${mensagem}`,
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
        + `mas nao houve navegacao para o perfil anterior. antes=${urlAntes}|depois=${urlDepois}`
        + `|elemento=${diagnostico.tag}|role=${diagnostico.role || '-'}|href=${diagnostico.href || '-'}|cursor=${diagnostico.cursor || '-'}`
        + `|pai=${diagnostico.parentTag || '-'}|paiRole=${diagnostico.parentRole || '-'}|paiCursor=${diagnostico.parentCursor || '-'}`,
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
