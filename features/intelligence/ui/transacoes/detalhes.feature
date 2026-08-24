# language: pt
@intelligence @ui @transaction @deeplink
Funcionalidade: Detalhes da transação
  Como usuário do Intelligence
  Quero abrir uma transação diretamente pelo TGUID
  Para consultar seus detalhes conforme meu nível de acesso

  @positive @acceptance @regression @smoke @int-100 @case-INT-100-BASELINE @release-unassigned @admin @permission-intelligence_user
  Cenário: Usuário admin abre transação por deep-link com acesso de escrita
    Dado que o caso "INT-100-BASELINE" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

  @positive @acceptance @regression @int-100 @case-INT-100-I1 @release-unassigned @viewonly @permission-intelligence_view_only @readonly
  Cenário: Usuário view-only abre transação por deep-link sem controles de escrita
    Dado que o caso "INT-100-I1" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido
