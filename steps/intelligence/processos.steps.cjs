'use strict';

const { Given, Then, When } = require('@cucumber/cucumber');
const { registrarDefinicoes } = require('./playwright.bridge.cjs');

registrarDefinicoes(Given, 'DADO', [
  'existe processo criminal no banco',
  'existe processo necro no banco',
]);

registrarDefinicoes(When, 'QUANDO', [
  'busca pelo número do processo',
  'acessa a seção de processos criminais',
  'abre processo criminal',
  'tenta acessar processos criminais',
  'acessa a seção de processos necros',
  'abre processo necro',
  'tenta acessar processos necros',
], true);

registrarDefinicoes(Then, 'ENTÃO', [
  'retorna processo com todos os dados',
  'busca e filtros estão disponíveis',
  'visualiza dados sem controles de escrita',
  'é redirecionado para tela informativa',
  'retorna processo com dados de óbito',
]);
