'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(30_000);

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
  const raiz = path.resolve(__dirname, '..', '..', 'tests');
  const marcador = `[${id}]`;
  for (const arquivo of listarSpecs(raiz)) {
    const conteudo = fs.readFileSync(arquivo, 'utf8');
    if (conteudo.includes(marcador)) {
      return path.relative(path.resolve(__dirname, '..', '..'), arquivo).replaceAll('\\', '/');
    }
  }
  return null;
}

Given('que o cenário está vinculado ao ticket {string}', function (ticket) {
  this.ticket = ticket;
});

When('o cenário visual estiver vinculado ao Playwright {string}', function (id) {
  const arquivo = localizarTestePorId(id);
  if (!arquivo) {
    throw new Error(`Mapeamento Cucumber sem teste Playwright correspondente: ${id}`);
  }
  this.playwrightTestId = id;
  this.playwrightSpec = arquivo;
});

Then('o vínculo com a automação deve existir', function () {
  if (!this.ticket || !this.playwrightTestId || !this.playwrightSpec) {
    throw new Error('Cenário Cucumber sem vínculo completo com o Playwright.');
  }
});
