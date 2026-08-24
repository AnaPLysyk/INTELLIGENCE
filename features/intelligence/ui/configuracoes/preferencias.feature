# language: pt
@intelligence @ui @settings
Funcionalidade: Configurações pessoais
  Como usuário somente leitura
  Quero continuar acessando configurações pessoais permitidas
  Para ajustar a visualização sem obter funções de escrita de negócio

  @positive @acceptance @regression @int-100 @case-INT-100-I4 @release-unassigned @viewonly @permission-intelligence_view_only
  Cenário: Acesso a configurações de tema e preferências pessoais
    Dado que o caso "INT-100-I4" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido
