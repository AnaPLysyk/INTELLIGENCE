'use strict';

const { Given } = require('@cucumber/cucumber');
const { registrarDefinicoes } = require('./playwright.bridge.cjs');

registrarDefinicoes(Given, 'DADO', [
  'que existe admin autenticado',
  'que existe view-only autenticado',
  'que existe usuário autenticado',
  'que existe investigador autenticado',
  'que existe gestor autenticado',
  'que existe consultor autenticado',
  'que existe usuário sem permissão',
]);
