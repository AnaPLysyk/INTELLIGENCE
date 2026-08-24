'use strict';

const { Given, Then, When } = require('@cucumber/cucumber');
const { registrarDefinicoes } = require('./playwright.bridge.cjs');

registrarDefinicoes(Given, 'DADO', [
  'existe perfil no banco',
]);

registrarDefinicoes(When, 'QUANDO', [
  'consulta perfil pela API',
  'consulta perfil conhecida pela API',
  'consulta PGUID aleatório',
], true);

registrarDefinicoes(Then, 'ENTÃO', [
  'retorna dados completos com HTTP {int}',
  'retorna HTTP {int}',
]);
