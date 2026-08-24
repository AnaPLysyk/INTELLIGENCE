# language: pt
@intelligence @api @fields
Funcionalidade: Catálogo de campos pesquisáveis
  Como QA do Intelligence
  Quero validar o catálogo de campos disponibilizado pela API
  Para garantir configuração consistente e protegida por sessão

  @positive @regression @release-5.5.0.5062 @int-23 @admin @permission-intelligence_user @case-API-POS-FIELDS-01
  Cenário: Retorno do catálogo de campos pesquisáveis
    Dado que tenho credenciais de administrador
    Quando consulto o catálogo de campos pela API
    Então recebo resposta com status 200
    E o catálogo contém lista de campos pesquisáveis

  @negative @regression @release-5.5.0.5062 @int-23 @case-API-NEG-FIELDS-AUTH-01
  Cenário: Bloqueio de catálogo sem autenticação
    Dado que não possuo sessão autenticada
    Quando consulto o catálogo de campos pela API
    Então recebo resposta com status 401

  @negative @regression @release-5.5.0.5062 @int-23 @case-API-NEG-FIELDS-AUTH-02
  Cenário: Bloqueio de catálogo com sessão expirada
    Dado que possuo sessão com token expirado
    Quando consulto o catálogo de campos pela API
    Então recebo resposta com status 401
