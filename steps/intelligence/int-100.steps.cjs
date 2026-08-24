'use strict';

const { Given, Then, When } = require('@cucumber/cucumber');
const { registrarDefinicoes } = require('./playwright.bridge.cjs');

registrarDefinicoes(Given, 'DADO', [
  'que existe um usuário com acesso completo',
  'que existe um usuário com permissão somente leitura',
  'que existe um usuário sem permissão do Intelligence',
]);

registrarDefinicoes(When, 'QUANDO', [
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
], true);

registrarDefinicoes(Then, 'ENTÃO', [
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
