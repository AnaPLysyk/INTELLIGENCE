import { expect, type Page } from '@playwright/test';

export type CredenciaisIntelligence = { usuario: string; senha: string };
export type OpcaoBuscaIntelligence = { valor: string; rotulo: string };

const ROTULOS_DE_ESCRITA = [
  /editar/i,
  /salvar/i,
  /excluir/i,
  /tratar/i,
  /exportar/i,
  /enviar/i,
  /confirmar/i,
  /ver nova transa[cç][aã]o/i,
];

export class IntelligencePage {
  constructor(private readonly page: Page) {}

  obterUrlBase(): string {
    const url = process.env.INTELLIGENCE_UI_URL?.trim();
    if (!url) throw new Error('CONFIGURACAO: INTELLIGENCE_UI_URL nao foi informada.');
    return url.replace(/\/$/, '');
  }

  async autenticarComCredenciais(credenciais: CredenciaisIntelligence): Promise<void> {
    await this.page.goto(`${this.obterUrlBase()}/`, { waitUntil: 'domcontentloaded' });
    const usuario = this.page.locator('input[name="username"]');
    await expect(usuario, 'A tela de login deve exibir o campo de usuario.').toBeVisible({ timeout: 30_000 });
    await usuario.fill(credenciais.usuario);
    await this.page.locator('input[name="password"]').fill(credenciais.senha);
    await this.page.getByRole('button', { name: /acessar/i }).click();
    await expect(usuario, 'O login deve sair da tela de autenticacao.').toBeHidden({ timeout: 30_000 });
    await expect.poll(
      () => this.page.evaluate(() => Boolean(localStorage.getItem('@GRIAULE:session'))),
      { message: 'O Intelligence deve registrar a sessao autenticada.', timeout: 30_000 },
    ).toBe(true);
  }

  async validarBuscaDisponivel(): Promise<void> {
    await expect(this.page.locator('select').first(), 'A busca deve exibir o seletor Chave.')
      .toBeEnabled({ timeout: 30_000 });
    await expect(this.page.getByRole('button', { name: /pesquisar/i }), 'A busca deve permitir pesquisar.')
      .toBeEnabled({ timeout: 30_000 });
  }

  async lerOpcoesDoSeletorDeBusca(): Promise<OpcaoBuscaIntelligence[]> {
    const seletor = this.page.locator('select').first();
    await expect(seletor, 'A busca deve exibir o seletor de campos.').toBeVisible({ timeout: 30_000 });
    return seletor.locator('option').evaluateAll((opcoes) => opcoes.map((opcao) => ({
      valor: (opcao as HTMLOptionElement).value.trim(),
      rotulo: (opcao.textContent ?? '').trim(),
    })));
  }

  async validarBuscaIndisponivel(): Promise<void> {
    const seletor = this.page.locator('select').first();
    const pesquisar = this.page.getByRole('button', { name: /pesquisar/i });
    const disponivel = await seletor.count() > 0
      && await pesquisar.count() > 0
      && await seletor.isEnabled().catch(() => false)
      && await pesquisar.isEnabled().catch(() => false);
    expect(disponivel, 'O perfil somente leitura nao deve conseguir usar a busca.').toBe(false);
  }

  async abrirDetalhesDaTransacaoPorTguid(tguid: string): Promise<void> {
    const template = process.env.INT_100_TRANSACAO_URL_TEMPLATE?.trim();
    if (!template) throw new Error('CONFIGURACAO: INT_100_TRANSACAO_URL_TEMPLATE nao foi informado.');
    const url = template
      .replace('{base}', this.obterUrlBase())
      .replace('{tguid}', encodeURIComponent(tguid));
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async validarDetalhesDaTransacaoCarregados(tguid: string): Promise<void> {
    await expect(
      this.page.getByText(/dados da transa[cç][aã]o/i).first(),
      'A pagina deve exibir a secao Dados da transacao.',
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      this.page.locator('body'),
      'A pagina deve exibir o TGUID solicitado.',
    ).toContainText(tguid, { ignoreCase: true, timeout: 30_000 });
  }

  async validarNavegacaoDoPerfilReconhecida(): Promise<void> {
    const corpo = this.page.locator('body');
    await expect(
      corpo,
      'O link deve resolver a tela de perfil ou o estado documentado sem resultados.',
    ).toContainText(/perfil|nenhum resultado encontrado/i, { timeout: 30_000 });
    await expect(
      corpo,
      'Um link de PGUID valido nao deve cair na pagina 404.',
    ).not.toContainText(/p[aá]gina n[aã]o encontrada/i);
  }

  async abrirPerfilVinculadoNaTransacao(tguid: string, pguid: string): Promise<void> {
    await this.abrirDetalhesDaTransacaoPorTguid(tguid);
    await this.validarDetalhesDaTransacaoCarregados(tguid);
    const linkDoPerfil = this.page.locator('a').filter({ hasText: pguid }).first();
    await expect(
      linkDoPerfil,
      'Os detalhes da transacao devem oferecer um link para o PGUID vinculado.',
    ).toBeVisible({ timeout: 30_000 });
    await linkDoPerfil.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async abrirDetalhesDoPerfilPorPguid(pguid: string): Promise<void> {
    const template = process.env.INT_100_PERFIL_URL_TEMPLATE?.trim();
    if (!template) throw new Error('CONFIGURACAO: INT_100_PERFIL_URL_TEMPLATE nao foi informado.');
    const url = template
      .replace('{base}', this.obterUrlBase())
      .replace('{pguid}', encodeURIComponent(pguid));
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async validarAusenciaDeControlesDeEscrita(): Promise<void> {
    for (const rotulo of ROTULOS_DE_ESCRITA) {
      const controle = this.page.getByRole('button', { name: rotulo });
      if (await controle.count() > 0) {
        expect(
          await controle.first().isDisabled().catch(() => true),
          `O controle de escrita ${rotulo} deve estar desabilitado.`,
        ).toBe(true);
      }
    }
  }

  async validarTransacaoNaoExposta(tguid: string): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    await expect(
      this.page.locator('body'),
      'Um usuario sem permissao nao deve visualizar o TGUID solicitado.',
    ).not.toContainText(tguid, { ignoreCase: true });
  }

  async tentarPesquisarComValorVazio(): Promise<{ urlAntes: string; urlDepois: string }> {
    const campo = this.page.locator('input:visible').first();
    const pesquisar = this.page.getByRole('button', { name: /pesquisar/i });
    await expect(campo, 'A busca deve exibir um campo para o valor.').toBeVisible({ timeout: 30_000 });
    await campo.fill('');
    const urlAntes = this.page.url();
    if (await pesquisar.isEnabled().catch(() => false)) {
      await pesquisar.click();
      await this.page.waitForTimeout(500);
    }
    return { urlAntes, urlDepois: this.page.url() };
  }

  async submeterEntradaHostilNaBusca(
    payload: string,
  ): Promise<{ dialogoAberto: boolean; scriptInjetado: boolean }> {
    let dialogoAberto = false;
    this.page.on('dialog', async (dialogo) => {
      dialogoAberto = true;
      await dialogo.dismiss();
    });
    const seletor = this.page.locator('select').first();
    const campo = this.page.locator('input:visible').first();
    const pesquisar = this.page.getByRole('button', { name: /pesquisar/i });
    await expect(seletor).toBeVisible({ timeout: 30_000 });
    const quantidade = await seletor.locator('option').count();
    if (quantidade > 1) await seletor.selectOption({ index: 1 });
    await campo.fill(payload);
    await pesquisar.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.page.waitForTimeout(500);
    const scriptInjetado = await this.page.locator('script').evaluateAll(
      (scripts, valor) => scripts.some((script) => (script.textContent ?? '').includes(String(valor))),
      payload,
    );
    return { dialogoAberto, scriptInjetado };
  }
}
