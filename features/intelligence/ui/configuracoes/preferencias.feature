# language: pt
@intelligence @ui @settings
Funcionalidade: Configurações pessoais
  Como usuário somente leitura
  Quero continuar acessando configurações pessoais permitidas
  Para ajustar a visualização sem obter funções de escrita de negócio

  @positive @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @case-INT-100-I4
  Cenário: Acesso a configurações de tema e preferências pessoais
    Dado que sou usuário view-only
    Quando acesso menu de configurações
    Então consigo alterar preferências de tema e visualização
