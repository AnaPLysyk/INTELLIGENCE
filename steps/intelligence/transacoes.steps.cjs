'use strict';

const { Given, Then, When } = require('@cucumber/cucumber');
const { registrarDefinicoes } = require('./playwright.bridge.cjs');

registrarDefinicoes(Given, 'DADO', [
  'existe CPF com transações no banco',
  'existe transação no banco',
]);

registrarDefinicoes(When, 'QUANDO', [
  'chama a API de busca com CPF',
  'acessa a tela principal',
  'chama a API de busca',
  'abre detalhes pelo TGUID',
  'abre detalhes da transação',
], true);

registrarDefinicoes(Then, 'ENTÃO', [
  'retorna lista de transações com HTTP {int}',
  'campo de busca está visível e ativo',
  'retorna HTTP {int} (acesso negado)',
  'campo de busca não está visível',
  'todos os campos são exibidos',
  'detalhes são exibidos sem botões de edição',
]);
