'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  After,
  Before,
  Given,
  Then,
  When,
  setDefaultTimeout,
} = require('@cucumber/cucumber');

setDefaultTimeout(30_000);

const RAIZ_PROJETO = path.resolve(__dirname, '..', '..');
const RAIZ_TESTES = path.join(RAIZ_PROJETO, 'tests');
const PREFIXO_VINCULO = '@pw-';

function listarSpecs(raiz, saida = []) {
  if (!fs.existsSync(raiz)) return saida;

  for (const item of fs.readdirSync(raiz, { withFileTypes: true })) {
    const absoluto = path.join(raiz, item.name);
    if (item.isDirectory()) listarSpecs(absoluto, saida);
    else if (/\.spec\.ts$/i.test(item.name)) saida.push(absoluto);
  }

  return saida;
}

function localizarTestePorId(id) {
  const marcador = `[${id}]`;

  for (const arquivo of listarSpecs(RAIZ_TESTES)) {
    const conteudo = fs.readFileSync(arquivo, 'utf8');
    if (conteudo.includes(marcador)) {
      return path.relative(RAIZ_PROJETO, arquivo).replaceAll('\\', '/');
    }
  }

  return null;
}

function registrarPasso(registrar, tipo, textos) {
  for (const texto of textos) {
    registrar(texto, function () {
      if (!Array.isArray(this.passosVisuais)) this.passosVisuais = [];
      this.passosVisuais.push(`${tipo}: ${texto}`);
    });
  }
}

Before(function ({ pickle }) {
  const vinculos = pickle.tags
    .map((tag) => tag.name)
    .filter((nome) => nome.startsWith(PREFIXO_VINCULO));

  if (vinculos.length !== 1) {
    throw new Error(
      `Cenário "${pickle.name}" deve possuir exatamente uma tag ${PREFIXO_VINCULO}<ID>.`,
    );
  }

  const id = vinculos[0].slice(PREFIXO_VINCULO.length);
  const spec = localizarTestePorId(id);

  if (!spec) {
    throw new Error(`Mapeamento Cucumber sem teste Playwright correspondente: ${id}`);
  }

  this.vinculoPlaywright = { id, spec };
});

registrarPasso(Given, 'DADO', [
  'que existe um usuário com acesso completo',
  'que existe um usuário com permissão somente leitura',
  'que existe um usuário sem permissão do Intelligence',
]);

registrarPasso(When, 'QUANDO', [
  'ele acessa o Intelligence pela tela principal',
  'ele abre uma transação diretamente pelo TGUID',
  'ele chama diretamente os endpoints de count e list',
  'ele consulta um PGUID inexistente pela API',
  'ele tenta executar operações de escrita',
  'ele consulta um perfil conhecido pelo PGUID',
  'ele acessa a raiz, recarrega ou tenta abrir uma rota de busca',
  'ele acessa uma rota inexistente e seleciona Voltar',
  'ele abre diretamente um perfil inexistente pelo PGUID',
  'ele abre as configurações e seleciona o logo da aplicação',
  'ele abre as configurações pelo header',
  'ele abre um perfil diretamente pelo PGUID',
  'ele tenta autenticar na aplicação',
]);

registrarPasso(Then, 'ENTÃO', [
  'o seletor de busca e o botão Pesquisar devem estar disponíveis',
  'os detalhes da transação e o TGUID solicitado devem ser exibidos',
  'os endpoints de busca devem responder 403',
  'a API não deve responder 500',
  'as operações de escrita devem responder 403',
  'a API deve retornar o perfil com status 200',
  'a tela informativa deve permanecer visível e a busca não deve aparecer',
  'a aplicação deve retornar para a tela informativa do modo somente leitura',
  'uma indicação de perfil não encontrado deve ser preservada',
  'tema, idioma, data, hora e versões devem permanecer disponíveis',
  'a transação solicitada deve ser exibida',
  'o perfil solicitado deve ser exibido',
  'os controles de escrita não devem ser exibidos',
  'nenhuma sessão do Intelligence deve ser criada',
]);

After(async function ({ pickle }) {
  if (!this.vinculoPlaywright || typeof this.attach !== 'function') return;

  const resumo = [
    `Cenário visual: ${pickle.name}`,
    `Playwright: [${this.vinculoPlaywright.id}]`,
    `Spec: ${this.vinculoPlaywright.spec}`,
    'Tipo de evidência: catálogo BDD + validação de vínculo.',
    'Aceite funcional: executar Playwright/Ranger antes de enviar resultado ao Qase.',
  ].join('\n');

  await this.attach(resumo, 'text/plain');
});
