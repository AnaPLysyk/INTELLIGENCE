# language: pt
@intelligence @api @search @profile
Funcionalidade: Busca de perfis pela API
  Como QA do Intelligence
  Quero validar pesquisa, paginação, autorização e robustez da busca de perfis
  Para garantir resultados corretos sem expor dados indevidamente

  @positive @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-POS-EXTERNAL-01
  Cenário: Busca por ID externo retorna resultados
    Dado que possuo credenciais de administrador
    E tenho ID externo válido
    Quando executo busca por ID externo
    Então recebo lista de perfis correspondentes

  @positive @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-POS-BIRTHDATE-01
  Cenário: Busca por data de nascimento retorna resultados
    Dado que possuo credenciais de administrador
    E tenho data de nascimento válida
    Quando executo busca por data de nascimento
    Então recebo lista de perfis correspondentes

  @positive @regression @smoke @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-POS-CPF-01
  Cenário: Busca rápida por CPF retorna resultado
    Dado que possuo credenciais de administrador
    E tenho CPF válido
    Quando executo busca por CPF
    Então recebo resultado correspondente

  @negative @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-NEG-NOTFOUND-01
  Cenário: Busca sem resultado retorna lista vazia
    Dado que possuo credenciais de administrador
    E tenho critério que não corresponde a nenhum perfil
    Quando executo a busca
    Então recebo lista vazia

  @negative @regression @smoke @release-5.5.0.5062 @case-API-NEG-COMMON-04
  Cenário: Bloqueio de busca sem sessão autenticada
    Dado que não possuo sessão autenticada
    Quando executo busca
    Então recebo resposta com status 401

  @negative @regression @destructive @security @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-DES-SQLI-01
  Cenário: Bloqueio de injeção SQL em busca
    Dado que possuo credenciais de administrador
    E insiro payload SQL injection em critério de busca
    Quando submeto a busca
    Então o payload é bloqueado ou escapado

  @negative @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @case-API-NEG-COMMON-06
  Cenário: Negação de busca para usuário view-only
    Dado que tenho permissão view-only
    Quando executo busca
    Então recebo resposta com status 403
