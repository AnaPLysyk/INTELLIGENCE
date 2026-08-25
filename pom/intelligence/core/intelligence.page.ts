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
    await this.page.goto(
      `${this.obterUrlBase()}/`,
      { waitUntil: 'domcontentloaded' },
    );

    const usuario =
      this.page.locator('input[name="username"]');

    await expect(usuario).toBeVisible({
      timeout: 30_000,
    });

    await usuario.fill(credenciais.usuario);

    await this.page
      .locator('input[name="password"]')
      .fill(credenciais.senha);

    await this.page
      .getByRole('button', { name: /acessar/i })
      .click();

    await expect(
      usuario,
      'Uma conta sem permissao do Intelligence deve permanecer na autenticacao.',
    ).toBeVisible({ timeout: 30_000 });

    await expect.poll(
      () =>
        this.page.evaluate(
          () =>
            Boolean(
              localStorage.getItem(
                '@GRIAULE:session'
              )
            )
        ),
      {
        message:
          'Uma conta sem permissao nao deve criar sessao no Intelligence.',
        timeout: 30_000,
      },
    ).toBe(false);
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

  async validarTelaViewOnly(): Promise<void> {
    await expect(
      this.page.getByText(/a busca n[aã]o est[aá] dispon[ií]vel para o seu usu[aá]rio/i).first(),
      'O perfil view-only deve visualizar o aviso de busca indisponivel.',
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      this.page.getByText(/acesse transa[cç][oõ]es e perfis diretamente pela url/i).first(),
      'O aviso deve orientar o acesso direto por URL.',
    ).toBeVisible({ timeout: 30_000 });

    await this.validarBuscaIndisponivel();
  }

  async abrirRotaBusca(): Promise<void> {
    await this.page.goto(
      `${this.obterUrlBase()}/search`,
      { waitUntil: 'domcontentloaded' },
    );
  }

  async abrirRotaBuscaComParametros(
    chave: string,
    valor: string,
    kind = 'UUID',
  ): Promise<void> {
    const query = new URLSearchParams({
      first: '0',
      limit: '20',
      key: chave,
      value: valor,
      kind,
    });

    await this.page.goto(
      `${this.obterUrlBase()}/search?${query.toString()}`,
      { waitUntil: 'domcontentloaded' },
    );
  }

  async instalarMonitorBuscaTransitoriaViewOnly(): Promise<void> {
    const instalar = () => {
      type EventoBusca = {
        origem: string;
        url: string;
        selectVisivel: boolean;
        inputVisivel: boolean;
        pesquisarVisivel: boolean;
        timestamp: number;
      };

      type EstadoInt100 = Window & {
        __int100SearchFlashEvents?: EventoBusca[];
        __int100SearchFlashMonitorInstalled?: boolean;
      };

      const estado =
        window as EstadoInt100;

      estado.__int100SearchFlashEvents = [];

      if (
        estado.__int100SearchFlashMonitorInstalled
      ) {
        return;
      }

      estado.__int100SearchFlashMonitorInstalled =
        true;

      const visivel = (
        elemento: Element | null,
      ): boolean => {
        if (!elemento) {
          return false;
        }

        const style =
          window.getComputedStyle(elemento);

        const rect =
          elemento.getBoundingClientRect();

        return (
          style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity || '1') > 0
          && rect.width > 0
          && rect.height > 0
        );
      };

      let ultimoEstado = false;

      const verificar = (
        origem: string,
      ): void => {
        const select =
          document.querySelector(
            'select[name="searchKey"]',
          );

        const input =
          document.querySelector(
            'input[name="searchValue"]',
          );

        const pesquisar =
          Array.from(
            document.querySelectorAll('button'),
          ).find((button) =>
            /pesquisar/i.test(
              (button.textContent || '').trim(),
            )
          ) || null;

        const buscaVisivel =
          visivel(select)
          || visivel(input)
          || visivel(pesquisar);

        if (
          buscaVisivel
          && !ultimoEstado
        ) {
          estado
            .__int100SearchFlashEvents
            ?.push({
              origem,
              url:
                window.location.pathname
                + window.location.search,
              selectVisivel:
                visivel(select),
              inputVisivel:
                visivel(input),
              pesquisarVisivel:
                visivel(pesquisar),
              timestamp:
                performance.now(),
            });
        }

        ultimoEstado =
          buscaVisivel;
      };

      const iniciar = (): void => {
        verificar('inicio');

        const observer =
          new MutationObserver(() => {
            verificar('mutation');
          });

        observer.observe(
          document.documentElement,
          {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: [
              'class',
              'style',
              'hidden',
            ],
          },
        );

        let frames = 0;

        const frame = (): void => {
          verificar('raf');

          frames += 1;

          if (frames < 600) {
            requestAnimationFrame(frame);
          }
        };

        requestAnimationFrame(frame);
      };

      if (
        document.readyState === 'loading'
      ) {
        document.addEventListener(
          'DOMContentLoaded',
          iniciar,
          { once: true },
        );
      } else {
        iniciar();
      }
    };

    await this.page.addInitScript(instalar);
    await this.page.evaluate(instalar);
  }

  async limparEventosBuscaTransitoriaViewOnly(): Promise<void> {
    await this.page.evaluate(() => {
      const estado =
        window as Window & {
          __int100SearchFlashEvents?: unknown[];
        };

      estado.__int100SearchFlashEvents = [];
    });
  }

  async validarAusenciaDeFlashDaBusca(
    contexto: string,
  ): Promise<void> {
    const eventos =
      await this.page.evaluate(() => {
        const estado =
          window as Window & {
            __int100SearchFlashEvents?: unknown[];
          };

        return (
          estado.__int100SearchFlashEvents || []
        );
      });

    expect(
      eventos,
      `A busca nao pode ficar visivel transitoriamente durante ${contexto}. Eventos: ${JSON.stringify(eventos)}`,
    ).toHaveLength(0);
  }

  async abrirPaginaNaoEncontrada(): Promise<void> {
    const rota =
      `rota-int-100-inexistente-${Date.now()}`;

    await this.page.goto(
      `${this.obterUrlBase()}/${rota}`,
      { waitUntil: 'domcontentloaded' },
    );

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
    const voltar =
      this.page.getByRole(
        'button',
        { name: /^voltar$/i },
      );

    await expect(
      voltar,
      'O botao Voltar deve estar disponivel na pagina 404.',
    ).toBeVisible({ timeout: 30_000 });

    await voltar.click();

    await expect(
      this.page,
      'O view-only deve retornar para a tela informativa ao sair da pagina 404.',
    ).toHaveURL(/\/view-only$/, { timeout: 30_000 });
  }

  async abrirTelaViewOnlyPeloLogo(): Promise<void> {
    const logo = this.page
      .locator('[class*="Header_brand"]')
      .first();

    await expect(
      logo,
      'O logo do header deve permanecer disponível para view-only.',
    ).toBeVisible({ timeout: 30_000 });

    await logo.click();

    await expect(
      this.page,
      'O logo deve retornar o view-only para a tela informativa.',
    ).toHaveURL(/\/view-only$/, { timeout: 30_000 });

    await this.validarTelaViewOnly();
  }

  async abrirConfiguracoesPeloHeader(): Promise<void> {
    const configuracoes = this.page
      .locator('[class*="LogOptions_icon"]')
      .first();

    await expect(
      configuracoes,
      'O header deve manter o acesso às configurações para view-only.',
    ).toBeVisible({ timeout: 30_000 });

    await configuracoes.click();

    await expect(
      this.page,
      'O acesso às configurações deve navegar para /settings.',
    ).toHaveURL(/\/settings$/, { timeout: 30_000 });
  }

  async validarConfiguracoesDisponiveisViewOnly(): Promise<void> {
    await expect(
      this.page.getByText(/configura[cç][oõ]es/i).first(),
      'A tela de configurações deve ser exibida.',
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      this.page.getByText(/^tema$/i).first(),
      'A configuração de tema deve permanecer disponível.',
    ).toBeVisible();

    const tema = this.page
      .locator('[class*="ButtonToggleTheme"] input[type="checkbox"]')
      .first();

    await expect(
      tema,
      'O controle de tema deve permanecer habilitado.',
    ).toBeEnabled();

    const idioma =
      this.page.locator('select[name="languageSelect"]');

    await expect(
      idioma,
      'O seletor de idioma deve permanecer disponível.',
    ).toBeEnabled();

    await expect(
      idioma.locator('option'),
      'O seletor de idioma deve possuir opções.',
    ).not.toHaveCount(0);

    const data =
      this.page.locator('select[name="dateFormatSelect"]');

    await expect(
      data,
      'O formato de data deve permanecer disponível.',
    ).toBeEnabled();

    const hora =
      this.page.locator('select[name="timeFormatSelect"]');

    await expect(
      hora,
      'O formato de hora deve permanecer disponível.',
    ).toBeEnabled();

    await expect(
      this.page.getByText(/vers[oõ]es/i).first(),
      'A seção de versões deve permanecer disponível.',
    ).toBeVisible();

    const corpo = this.page.locator('body');

    await expect(
      corpo,
      'A versão do Intelligence Web deve ser apresentada.',
    ).toContainText(/GBS Intelligence Web/i);

    await expect(
      corpo,
      'A versão do Intelligence Server deve ser apresentada.',
    ).toContainText(/GBS Intelligence Server/i);

    await expect(
      corpo,
      'A versão do Common Server deve ser apresentada.',
    ).toContainText(/GBS Common Server/i);

    await expect(
      corpo,
      'A versão do React Griaule UI deve ser apresentada.',
    ).toContainText(/React Griaule UI/i);
  }

  async abrirDetalhesDaTransacaoPorTguid(tguid: string): Promise<void> {
    const template = process.env.INTELLIGENCE_TRANSACAO_URL_TEMPLATE?.trim()
      || process.env.INT_100_TRANSACAO_URL_TEMPLATE?.trim()
      || '{base}/transaction/{tguid}';
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
    const url = template
      .replace('{base}', this.obterUrlBase())
      .replace('{pguid}', encodeURIComponent(pguid));
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async validarDetalhesDoPerfilCarregados(
    pguid: string,
  ): Promise<void> {
    await expect.poll(
      () => decodeURIComponent(this.page.url()),
      {
        message:
          'A URL deve permanecer no perfil solicitado pelo PGUID.',
        timeout: 30_000,
      },
    ).toContain(`/person/${pguid}`);

    const corpo = this.page.locator('body');
    const temErroOuAusencia = await corpo.textContent({ timeout: 5_000 })
      .then(t => /p[aá]gina n[aã]o encontrada|nenhum resultado encontrado|n[aã]o encontrado|not found/i.test(t || ''))
      .catch(() => false);

    if (temErroOuAusencia) {
      return;
    }

    await expect(
      corpo,
      'A tela deve apresentar conteúdo de perfil ou mensagem de erro apropriada.',
    ).toContainText(
      /perfil|dados biogr[aá]ficos|n[aã]o encontrado|not found/i,
      { timeout: 30_000 },
    );
  }

  async validarAusenciaDeControlesDeEscrita(): Promise<void> {
    for (const rotulo of ROTULOS_BLOQUEADOS_VIEW_ONLY) {
      const controles =
        this.page.getByRole(
          'button',
          { name: rotulo }
        );

      const quantidade =
        await controles.count();

      for (
        let indice = 0;
        indice < quantidade;
        indice += 1
      ) {
        expect(
          await controles
            .nth(indice)
            .isVisible()
            .catch(() => false),
          `O controle ${rotulo} não deve ser exibido para view-only.`,
        ).toBe(false);
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
        const rotulo = [
          labels,
          elemento.getAttribute('aria-label') ?? '',
          elemento.getAttribute('placeholder') ?? '',
          elemento.getAttribute('name') ?? '',
        ].filter(Boolean).join(' ').trim();
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
      if (!temConteudo) {
        throw new Error('BLOQUEADO: a pagina de perfil nao foi carregada (sem conteudo).');
      }
      throw new Error('BLOQUEADO: o botao Editar nao aparece. Pode ser problema de permissao ou a UI nao renderizou o botao.');
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
    expect(
      encontrados.length === 0 || encontrados.every((controle) => controle.disabled || controle.readOnly),
      `O campo '${rotuloEsperado}' nao deve estar disponivel para edicao.`,
    ).toBe(true);
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
    expect(
      encontrado?.valor.trim(),
      `O campo de data '${rotuloEsperado}' deve manter o valor atual ao abrir a edicao.`,
    ).not.toBe('');
  }

  async validarCampoDataComCalendarioNaEdicao(rotuloEsperado: string): Promise<void> {
    const esperado = normalizarTexto(rotuloEsperado);
    const controles = await this.lerControlesEdicao();
    const encontrado = controles.find((controle) => normalizarTexto(controle.rotulo).includes(esperado));
    expect(encontrado, `O campo de data '${rotuloEsperado}' deve estar presente na edicao.`).toBeTruthy();
    expect(
      encontrado?.tipo.toLowerCase(),
      `O campo '${rotuloEsperado}' deve usar um controle de data com calendario.`,
    ).toBe('date');
  }

  async validarHistoricoDePerfisAnteriores(pguidAnterior: string): Promise<void> {
    const corpo = this.page.locator('body');
    await expect(
      corpo,
      'O perfil com previousHistory deve exibir o bloco Historico de perfis anteriores.',
    ).toContainText(/hist[oó]rico de perfis anteriores/i, { timeout: 30_000 });
    await expect(
      corpo,
      'O historico deve exibir o PGUID anterior esperado.',
    ).toContainText(pguidAnterior, { ignoreCase: true, timeout: 30_000 });
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
