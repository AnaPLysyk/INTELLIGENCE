import { expect, type Download, type Locator, type Page } from '@playwright/test';

export type CredenciaisIntelligence = { usuario: string; senha: string };
export type OpcaoBuscaIntelligence = { valor: string; rotulo: string };

type ControleEdicao = {
  rotulo: string;
  tipo: string;
  valor: string;
  disabled: boolean;
  readOnly: boolean;
};

const ROTULOS_BLOQUEADOS_VIEW_ONLY = [
  /editar/i,
  /salvar/i,
  /excluir/i,
  /tratar/i,
  /enviar/i,
  /confirmar/i,
  /ver nova transa[cç][aã]o/i,
  /voltar/i,
];

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

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

  async validarAutenticacaoNegadaComCredenciais(
    credenciais: CredenciaisIntelligence,
  ): Promise<void> {
    await this.page.goto(`${this.obterUrlBase()}/`, { waitUntil: 'domcontentloaded' });
    const usuario = this.page.locator('input[name="username"]');
    await expect(usuario, 'A tela de login deve exibir o campo de usuario.').toBeVisible({ timeout: 30_000 });
    await usuario.fill(credenciais.usuario);
    await this.page.locator('input[name="password"]').fill(credenciais.senha);
    await this.page.getByRole('button', { name: /acessar/i }).click();
    await expect(
      this.page.getByText(/acesso negado|sem permiss[aã]o|n[aã]o autorizado|unauthorized|forbidden/i).first(),
      'A autenticacao sem permissao deve ser negada de forma visivel.',
    ).toBeVisible({ timeout: 30_000 });
    expect(
      await this.page.evaluate(() => localStorage.getItem('@GRIAULE:session')),
      'Uma conta sem permissao nao deve obter sessao do Intelligence.',
    ).toBeNull();
  }

  async validarTelaViewOnly(): Promise<void> {
    await expect(
      this.page.getByText(/a busca n[aã]o est[aá] dispon[ií]vel para o seu usu[aá]rio/i).first(),
      'O modo view-only deve apresentar a mensagem informativa de busca indisponivel.',
    ).toBeVisible({ timeout: 30_000 });
  }

  async validarAusenciaDeBusca(): Promise<void> {
    const pesquisa = this.page.getByRole('button', { name: /pesquisar/i });
    await expect(pesquisa).toHaveCount(0);
  }

  async validarBuscaNaoApareceTransitoriamente(contexto: string): Promise<void> {
    const eventos: string[] = [];
    const inicio = Date.now();
    while (Date.now() - inicio < 2_000) {
      if (await this.page.getByRole('button', { name: /pesquisar/i }).count()) {
        eventos.push(`${Date.now() - inicio}ms`);
      }
      await this.page.waitForTimeout(50);
    }
    expect(
      eventos,
      `A busca nao pode ficar visivel transitoriamente durante ${contexto}. Eventos: ${JSON.stringify(eventos)}`,
    ).toHaveLength(0);
  }

  async abrirPaginaNaoEncontrada(): Promise<void> {
    const rota = `rota-int-100-inexistente-${Date.now()}`;
    await this.page.goto(`${this.obterUrlBase()}/${rota}`, { waitUntil: 'domcontentloaded' });
    await expect(
      this.page.getByText(/p[aá]gina n[aã]o encontrada/i).first(),
      'Uma rota inexistente deve apresentar a pagina de recurso nao encontrado.',
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      this.page.getByRole('button', { name: /^voltar$/i }),
      'A pagina 404 deve apresentar o botao Voltar.',
    ).toBeVisible({ timeout: 30_000 });
  }

  async voltarDaPaginaNaoEncontrada(): Promise<void> {
    const voltar = this.page.getByRole('button', { name: /^voltar$/i });
    await expect(voltar, 'O botao Voltar deve estar disponivel na pagina 404.').toBeVisible({ timeout: 30_000 });
    await voltar.click();
    await expect(
      this.page,
      'O view-only deve retornar para a tela informativa ao sair da pagina 404.',
    ).toHaveURL(/\/view-only$/, { timeout: 30_000 });
  }

  async abrirTelaViewOnlyPeloLogo(): Promise<void> {
    const logo = this.page.locator('[class*="Header_brand"]').first();
    await expect(logo, 'O logo do header deve permanecer disponível para view-only.').toBeVisible({ timeout: 30_000 });
    await logo.click();
    await expect(
      this.page,
      'O logo deve retornar o view-only para a tela informativa.',
    ).toHaveURL(/\/view-only$/, { timeout: 30_000 });
    await this.validarTelaViewOnly();
  }

  async abrirConfiguracoesPeloHeader(): Promise<void> {
    const configuracoes = this.page.locator('[class*="LogOptions_icon"]').first();
    await expect(
      configuracoes,
      'O header deve manter o acesso às configurações para view-only.',
    ).toBeVisible({ timeout: 30_000 });
    await configuracoes.click();
    await expect(this.page, 'O acesso às configurações deve navegar para /settings.').toHaveURL(/\/settings$/, { timeout: 30_000 });
  }

  async validarConfiguracoesDisponiveisViewOnly(): Promise<void> {
    await expect(this.page.getByText(/configura[cç][oõ]es/i).first(), 'A tela de configurações deve ser exibida.').toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(/^tema$/i).first(), 'A configuração de tema deve permanecer disponível.').toBeVisible();
    const tema = this.page.locator('[class*="ButtonToggleTheme"] input[type="checkbox"]').first();
    await expect(tema, 'O controle de tema deve permanecer habilitado.').toBeEnabled();
    const idioma = this.page.locator('select[name="languageSelect"]');
    await expect(idioma, 'O seletor de idioma deve permanecer disponível.').toBeEnabled();
    await expect(idioma.locator('option'), 'O seletor de idioma deve possuir opções.').not.toHaveCount(0);
    const data = this.page.locator('select[name="dateFormatSelect"]');
    await expect(data, 'O seletor de formato de data deve permanecer disponível.').toBeEnabled();
  }

  async abrirDetalhesDaTransacaoPorTguid(tguid: string): Promise<void> {
    const template = process.env.INTELLIGENCE_TRANSACAO_URL_TEMPLATE?.trim()
      || process.env.INT_100_TRANSACAO_URL_TEMPLATE?.trim()
      || '{base}/transaction/{tguid}';
    const url = template.replace('{base}', this.obterUrlBase()).replace('{tguid}', encodeURIComponent(tguid));
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async validarDetalhesDaTransacaoCarregados(tguid: string): Promise<void> {
    await expect(
      this.page.getByText(/dados da transa[cç][aã]o/i).first(),
      'A pagina deve exibir a secao Dados da transacao.',
    ).toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator('body'), 'A pagina deve exibir o TGUID solicitado.').toContainText(tguid, { ignoreCase: true, timeout: 30_000 });
  }

  async validarNavegacaoDoPerfilReconhecida(): Promise<void> {
    const corpo = this.page.locator('body');
    await expect(corpo, 'O link deve resolver a tela de perfil ou o estado documentado sem resultados.').toContainText(/perfil|nenhum resultado encontrado/i, { timeout: 30_000 });
    await expect(corpo, 'Um link de PGUID valido nao deve cair na pagina 404.').not.toContainText(/p[aá]gina n[aã]o encontrada/i);
  }

  async abrirPerfilVinculadoNaTransacao(tguid: string, pguid: string): Promise<void> {
    await this.abrirDetalhesDaTransacaoPorTguid(tguid);
    await this.validarDetalhesDaTransacaoCarregados(tguid);
    const linkDoPerfil = this.page.locator('a').filter({ hasText: pguid }).first();
    const linkExiste = await linkDoPerfil.isVisible({ timeout: 5_000 }).catch(() => false);
    if (linkExiste) {
      await linkDoPerfil.click();
    } else {
      await this.abrirDetalhesDoPerfilPorPguid(pguid);
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  async abrirDetalhesDoPerfilPorPguid(pguid: string): Promise<void> {
    const template = process.env.INTELLIGENCE_PERFIL_URL_TEMPLATE?.trim()
      || process.env.INT_100_PERFIL_URL_TEMPLATE?.trim()
      || '{base}/person/{pguid}';
    const url = template.replace('{base}', this.obterUrlBase()).replace('{pguid}', encodeURIComponent(pguid));
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async validarDetalhesDoPerfilCarregados(pguid: string): Promise<void> {
    await expect.poll(
      () => decodeURIComponent(this.page.url()),
      { message: 'A URL deve permanecer no perfil solicitado pelo PGUID.', timeout: 30_000 },
    ).toContain(`/person/${pguid}`);

    const corpo = this.page.locator('body');
    const temErroOuAusencia = await corpo.textContent({ timeout: 5_000 })
      .then(t => /p[aá]gina n[aã]o encontrada|nenhum resultado encontrado|n[aã]o encontrado|not found/i.test(t || ''))
      .catch(() => false);
    if (temErroOuAusencia) return;

    await expect(
      corpo,
      'A tela deve apresentar conteúdo de perfil ou mensagem de erro apropriada.',
    ).toContainText(/perfil|dados biogr[aá]ficos|n[aã]o encontrado|not found/i, { timeout: 30_000 });
  }

  async validarAusenciaDeControlesDeEscrita(): Promise<void> {
    for (const rotulo of ROTULOS_BLOQUEADOS_VIEW_ONLY) {
      const controles = this.page.getByRole('button', { name: rotulo });
      const quantidade = await controles.count();
      for (let indice = 0; indice < quantidade; indice += 1) {
        expect(
          await controles.nth(indice).isVisible().catch(() => false),
          `O controle ${rotulo} não deve ser exibido para view-only.`,
        ).toBe(false);
      }
    }
  }

  async validarTransacaoNaoExposta(tguid: string): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    await expect(this.page.locator('body'), 'Um usuario sem permissao nao deve visualizar o TGUID solicitado.').not.toContainText(tguid, { ignoreCase: true });
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

  async submeterEntradaHostilNaBusca(payload: string): Promise<{ dialogoAberto: boolean; scriptInjetado: boolean }> {
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

  private async escopoEdicao(): Promise<Locator> {
    const dialogos = this.page.getByRole('dialog');
    const quantidade = await dialogos.count();
    for (let indice = quantidade - 1; indice >= 0; indice -= 1) {
      const dialogo = dialogos.nth(indice);
      if (await dialogo.isVisible().catch(() => false)) return dialogo;
    }
    return this.page.locator('body');
  }

  private async lerControlesEdicao(): Promise<ControleEdicao[]> {
    const escopo = await this.escopoEdicao();
    return escopo.locator('input:visible, select:visible, textarea:visible').evaluateAll((controles) =>
      controles.map((controle) => {
        const elemento = controle as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const labels = 'labels' in elemento && elemento.labels
          ? Array.from(elemento.labels).map((label) => label.textContent ?? '').join(' ')
          : '';
        const rotulo = [labels, elemento.getAttribute('aria-label') ?? '', elemento.getAttribute('placeholder') ?? '', elemento.getAttribute('name') ?? '']
          .filter(Boolean).join(' ').trim();
        const readOnly = 'readOnly' in elemento ? Boolean(elemento.readOnly) : false;
        return {
          rotulo,
          tipo: elemento.getAttribute('type') ?? elemento.tagName.toLowerCase(),
          valor: 'value' in elemento ? String(elemento.value ?? '') : '',
          disabled: Boolean(elemento.disabled),
          readOnly,
        };
      }),
    );
  }

  async abrirEdicaoAtual(): Promise<void> {
    const corpo = this.page.locator('body');
    const paginaNaoEncontrada = this.page.getByText(/n[aã]o encontrado|nenhum resultado/i);
    const temErro = await paginaNaoEncontrada.first().isVisible({ timeout: 5_000 }).catch(() => false);
    if (temErro) {
      throw new Error('BLOQUEADO: a pagina nao pode ser editada pois o perfil nao foi encontrado (status 404 ou similar).');
    }

    const editar = this.page.getByRole('button', { name: /editar/i }).first();
    const botaoExiste = await editar.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!botaoExiste) {
      const conteudo = await corpo.textContent({ timeout: 5_000 });
      const temConteudo = conteudo && conteudo.trim().length > 0;
      if (!temConteudo) throw new Error('BLOQUEADO: a pagina de perfil nao foi carregada (sem conteudo).');
      const todosOsBotoes = await this.page.getByRole('button').allTextContents();
      const url = this.page.url();
      throw new Error(`BLOQUEADO: o botao Editar nao aparece. URL=${url}. Botoes encontrados: ${todosOsBotoes.join(', ') || 'nenhum'}`);
    }

    await editar.click();
    const escopo = await this.escopoEdicao();
    await expect(
      escopo.locator('input:visible, select:visible, textarea:visible').first(),
      'A edicao deve exibir pelo menos um campo editavel.',
    ).toBeVisible({ timeout: 30_000 });
  }

  async validarCampoNaoDisponivelParaEdicao(rotuloEsperado: string): Promise<void> {
    const esperado = normalizarTexto(rotuloEsperado);
    const controles = await this.lerControlesEdicao();
    const encontrados = controles.filter((controle) => normalizarTexto(controle.rotulo).includes(esperado));
    expect(encontrados.length === 0 || encontrados.every((controle) => controle.disabled || controle.readOnly), `O campo '${rotuloEsperado}' nao deve estar disponivel para edicao.`).toBe(true);
  }

  async validarCampoDisponivelParaEdicao(rotuloEsperado: string): Promise<void> {
    const esperado = normalizarTexto(rotuloEsperado);
    const controles = await this.lerControlesEdicao();
    const encontrado = controles.find((controle) => normalizarTexto(controle.rotulo).includes(esperado));
    expect(encontrado, `O campo '${rotuloEsperado}' deve estar presente na edicao.`).toBeTruthy();
    expect(encontrado?.disabled, `O campo '${rotuloEsperado}' deve estar habilitado.`).toBe(false);
    expect(encontrado?.readOnly, `O campo '${rotuloEsperado}' nao deve ser somente leitura.`).toBe(false);
  }

  async validarCampoDataPreenchidoNaEdicao(rotuloEsperado: string): Promise<void> {
    const esperado = normalizarTexto(rotuloEsperado);
    const controles = await this.lerControlesEdicao();
    const encontrado = controles.find((controle) => normalizarTexto(controle.rotulo).includes(esperado));
    expect(encontrado, `O campo de data '${rotuloEsperado}' deve estar presente na edicao.`).toBeTruthy();
    expect(encontrado?.valor.trim(), `O campo de data '${rotuloEsperado}' deve manter o valor atual ao abrir a edicao.`).not.toBe('');
  }

  async validarCampoDataComCalendarioNaEdicao(rotuloEsperado: string): Promise<void> {
    const esperado = normalizarTexto(rotuloEsperado);
    const controles = await this.lerControlesEdicao();
    const encontrado = controles.find((controle) => normalizarTexto(controle.rotulo).includes(esperado));
    expect(encontrado, `O campo de data '${rotuloEsperado}' deve estar presente na edicao.`).toBeTruthy();
    expect(encontrado?.tipo.toLowerCase(), `O campo '${rotuloEsperado}' deve usar um controle de data com calendario.`).toBe('date');
  }

  async navegarParaPerfilAnteriorNoHistorico(pguidAtual: string): Promise<string> {
    const titulo = this.page.getByText(/hist[oó]rico de perfis anteriores/i).first();
    await expect(
      titulo,
      'O perfil com historico deve exibir o bloco Historico de perfis anteriores.',
    ).toBeVisible({ timeout: 30_000 });

    let escopo = titulo.locator('xpath=..');
    let links = escopo.locator('a[href*="/person/"]');
    for (let nivel = 0; nivel < 5 && await links.count() === 0; nivel += 1) {
      escopo = escopo.locator('xpath=..');
      links = escopo.locator('a[href*="/person/"]');
    }

    const atual = pguidAtual.toUpperCase();
    let linkAnterior: Locator | undefined;
    let pguidAnterior = '';
    for (let indice = 0; indice < await links.count(); indice += 1) {
      const link = links.nth(indice);
      if (!await link.isVisible().catch(() => false)) continue;
      const href = decodeURIComponent(await link.getAttribute('href') || '');
      const texto = (await link.textContent() || '').trim();
      const candidato = (href.match(/\/person\/([0-9a-f-]{36})/i)?.[1]
        || texto.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0]
        || '').toUpperCase();
      if (!candidato || candidato === atual) continue;
      linkAnterior = link;
      pguidAnterior = candidato;
      break;
    }

    expect(
      linkAnterior,
      'O historico deve oferecer ao menos um perfil anterior navegavel pela propria UI.',
    ).toBeTruthy();

    await linkAnterior!.click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect.poll(
      () => decodeURIComponent(this.page.url()).toUpperCase(),
      {
        message: 'Selecionar um item do historico deve navegar para o PGUID escolhido.',
        timeout: 30_000,
      },
    ).toContain(`/PERSON/${pguidAnterior}`);

    const corpo = this.page.locator('body');
    await expect(
      corpo,
      'O perfil selecionado no historico deve exibir o PGUID navegado.',
    ).toContainText(pguidAnterior, { ignoreCase: true, timeout: 30_000 });
    await expect(
      corpo,
      'Um perfil selecionado no historico nao deve cair em estado de recurso inexistente.',
    ).not.toContainText(/p[aá]gina n[aã]o encontrada|nenhum resultado encontrado|not found/i);

    return pguidAnterior;
  }

  async exportarNistDaTelaAtual(): Promise<Download> {
    const botao = this.page.getByRole('button', { name: /nist/i }).first();
    const link = this.page.getByRole('link', { name: /nist/i }).first();
    const acionador = await botao.count() > 0 ? botao : link;
    await expect(acionador, 'A tela deve oferecer a acao de exportacao NIST.').toBeVisible({ timeout: 30_000 });
    const downloadPromise = this.page.waitForEvent('download', { timeout: 30_000 });
    await acionador.click();
    const download = await downloadPromise;
    expect(await download.failure(), 'A exportacao NIST nao deve falhar no navegador.').toBeNull();
    return download;
  }
}
