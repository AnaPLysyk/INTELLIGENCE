# language: pt
@intelligence @ui @transaction @deeplink
Funcionalidade: Detalhes da transação
  Como usuário do Intelligence
  Quero abrir uma transação diretamente pelo TGUID
  Para consultar seus detalhes conforme meu nível de acesso

  @positive @acceptance @regression @smoke @int-100 @admin @permission-intelligence_user @case-INT-100-BASELINE
  Cenário: Abertura de transação por deep-link com permissão de escrita
    Dado que sou usuário administrador
    E acesso deep-link de transação com TGUID válido
    Quando a página carrega
    Então visualizo transação com controles de edição habilitados

  @positive @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @readonly @case-INT-100-I1
  Cenário: Abertura de transação por deep-link em modo somente leitura
    Dado que sou usuário view-only
    E acesso deep-link de transação com TGUID válido
    Quando a página carrega
    Então visualizo transação sem controles de edição
