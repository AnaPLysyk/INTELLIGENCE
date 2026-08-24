'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { After, Before, setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(240_000);

const RAIZ_PROJETO = path.resolve(__dirname, '..', '..');
const RAIZ_TESTES = path.join(RAIZ_PROJETO, 'tests');
const PREFIXO_VINCULO = '@pw-';
const cacheSpecs = new Map();

function listarSpecs(raiz, saida = []) {
  if (!fs.existsSync(raiz)) return saida;

  for (const item of fs.readdirSync(raiz, { withFileTypes: true })) {
    const absoluto = path.join(raiz, item.name);
    if (item.isDirectory()) listarSpecs(absoluto, saida);
    else if (/\.spec\.ts$/i.test(item.name)) saida.push(absoluto);
  }

  return saida;
}

function escaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localizarTestePorId(id) {
  if (cacheSpecs.has(id)) return cacheSpecs.get(id);

  const marcador = `[${id}]`;
  for (const arquivo of listarSpecs(RAIZ_TESTES)) {
    const conteudo = fs.readFileSync(arquivo, 'utf8');
    if (conteudo.includes(marcador)) {
      const relativo = path.relative(RAIZ_PROJETO, arquivo).replaceAll('\\', '/');
      cacheSpecs.set(id, relativo);
      return relativo;
    }
  }

  cacheSpecs.set(id, null);
  return null;
}

function registrarPasso(world, tipo, texto) {
  if (!Array.isArray(world.passosVisuais)) world.passosVisuais = [];
  world.passosVisuais.push(`${tipo}: ${texto}`);
}

async function anexar(world, conteudo, mime = 'text/plain') {
  if (typeof world.attach === 'function') await world.attach(conteudo, mime);
}

async function executarTesteVinculado(world) {
  if (world.playwrightExecutado) return;
  world.playwrightExecutado = true;

  const vinculo = world.vinculoPlaywright;
  if (!vinculo) throw new Error('Cenário Cucumber sem vínculo Playwright resolvido.');
  if (!vinculo.spec) {
    throw new Error(`Mapeamento Cucumber sem teste Playwright correspondente: ${vinculo.id}`);
  }

  const executavel = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const grep = `\\[${escaparRegex(vinculo.id)}\\]`;
  const argumentos = [
    'playwright',
    'test',
    vinculo.spec,
    '--grep',
    grep,
    '--workers=1',
    '--reporter=line',
  ];

  const resultado = spawnSync(executavel, argumentos, {
    cwd: RAIZ_PROJETO,
    env: process.env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 210_000,
  });

  const saida = [resultado.stdout, resultado.stderr].filter(Boolean).join('\n').trim();
  await anexar(
    world,
    [`Playwright: [${vinculo.id}]`, `Spec: ${vinculo.spec}`, saida || '(sem saída)'].join('\n'),
  );

  if (resultado.error) {
    throw new Error(`Falha ao executar Playwright [${vinculo.id}]: ${resultado.error.message}`);
  }

  if (resultado.status !== 0) {
    throw new Error(
      `Playwright [${vinculo.id}] falhou com exit code ${resultado.status}. Consulte a evidência anexada ao cenário.`,
    );
  }
}

function registrarDefinicoes(registrar, tipo, textos, executar = false) {
  for (const texto of textos) {
    registrar(texto, async function (..._args) {
      registrarPasso(this, tipo, texto);
      if (executar) await executarTesteVinculado(this);
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
  this.vinculoPlaywright = { id, spec: localizarTestePorId(id) };
  this.playwrightExecutado = false;
  this.passosVisuais = [];
});

After(async function ({ pickle }) {
  if (!this.vinculoPlaywright) return;

  const resumo = [
    `Cenário: ${pickle.name}`,
    `Playwright: [${this.vinculoPlaywright.id}]`,
    `Spec: ${this.vinculoPlaywright.spec || 'NÃO MAPEADO'}`,
    `Execução funcional: ${this.playwrightExecutado ? 'SIM' : 'NÃO'}`,
    ...(this.passosVisuais || []),
  ].join('\n');

  await anexar(this, resumo);
});

module.exports = {
  executarTesteVinculado,
  registrarDefinicoes,
};
