'use strict';

const { Given, Then, When } = require('@cucumber/cucumber');
const { registrarDefinicoes } = require('./playwright.bridge.cjs');

registrarDefinicoes(Given, 'DADO', [
  'que estou em português',
  'que escolhi English',
  'que escolhi tema escuro',
]);

registrarDefinicoes(When, 'QUANDO', [
  'abro configurações',
  'seleciono English',
  'faço logout e login novamente',
  'abre configurações',
  'seleciona tema escuro',
  'seleciona tema claro',
], true);

registrarDefinicoes(Then, 'ENTÃO', [
  'todos os textos estão em inglês',
  'interface está em English',
  'interface muda para tema escuro',
  'interface muda para tema claro',
  'tema continua escuro',
]);
