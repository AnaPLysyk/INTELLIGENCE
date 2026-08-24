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

  @positive @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-POS-NAME-01
  Cenário: Busca por nome retorna perfis correspondentes
    Dado que possuo credenciais de administrador
    E tenho nome válido para pesquisa
    Quando executo busca por nome
    Então recebo lista de perfis correspondentes

  @positive @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-POS-CIB-01
  Cenário: Busca por CIB retorna perfis correspondentes
    Dado que possuo credenciais de administrador
    E tenho CIB válido para pesquisa
    Quando executo busca por CIB
    Então recebo lista de perfis correspondentes

  @positive @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-POS-PAGINATION-01
  Cenário: Paginação limita a quantidade de perfis retornados
    Dado que possuo credenciais de administrador
    E tenho CPF válido para pesquisa paginada
    Quando executo busca com tamanho de página igual a um
    Então recebo no máximo um perfil na página

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

  @negative @regression @release-5.5.0.5062 @case-API-NEG-COMMON-05
  Cenário: Bloqueio de busca com sessão inválida
    Dado que possuo session-guid inválido
    Quando executo busca
    Então recebo resposta com status 401

  @negative @regression @release-5.5.0.5062 @admin @case-API-NEG-PAYLOAD-NAME-01
  Cenário: Payload sem nome do campo não expõe resultados
    Dado que possuo credenciais de administrador
    E envio payload de busca sem o atributo name
    Quando submeto a busca
    Então não recebo dados indevidos nem erro interno

  @negative @regression @release-5.5.0.5062 @admin @case-API-NEG-PAYLOAD-VALUE-01
  Cenário: Payload com valor vazio não expõe resultados
    Dado que possuo credenciais de administrador
    E envio payload de busca com value vazio
    Quando submeto a busca
    Então não recebo dados indevidos nem erro interno

  @negative @regression @release-5.5.0.5062 @admin @case-API-NEG-PAYLOAD-KIND-01
  Cenário: Payload com kind inválido não expõe resultados
    Dado que possuo credenciais de administrador
    E envio payload de busca com kind inválido
    Quando submeto a busca
    Então não recebo dados indevidos nem erro interno

  @negative @regression @destructive @security @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-API-DES-SQLI-01
  Cenário: Bloqueio de injeção SQL em busca
    Dado que possuo credenciais de administrador
    E insiro payload SQL injection em critério de busca
    Quando submeto a busca
    Então o payload é bloqueado ou escapado

  @negative @regression @destructive @security @release-5.5.0.5062 @admin @case-API-DES-XSS-01
  Cenário: Entrada XSS em busca não executa nem expõe resultados
    Dado que possuo credenciais de administrador
    E insiro payload XSS em critério de busca
    Quando submeto a busca
    Então não recebo dados indevidos nem erro interno

  @negative @regression @destructive @security @release-5.5.0.5062 @admin @case-API-DES-PATH-01
  Cenário: Path traversal em busca não expõe resultados
    Dado que possuo credenciais de administrador
    E insiro sequência de path traversal no critério de busca
    Quando submeto a busca
    Então não recebo dados indevidos nem erro interno

  @negative @regression @destructive @security @release-5.5.0.5062 @admin @case-API-DES-OVERSIZE-01
  Cenário: Valor excessivamente grande não provoca erro interno
    Dado que possuo credenciais de administrador
    E insiro valor de busca com tamanho excessivo
    Quando submeto a busca
    Então não recebo dados indevidos nem erro interno

  @negative @regression @release-5.5.0.5062 @admin @case-API-NEG-PAGINATION-01
  Cenário: Paginação negativa não provoca erro interno
    Dado que possuo credenciais de administrador
    E tenho CPF válido para pesquisa
    Quando executo busca com índice inicial negativo
    Então a API não retorna erro interno

  @negative @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @case-API-NEG-COMMON-06
  Cenário: Negação de busca para usuário view-only
    Dado que tenho permissão view-only
    Quando executo busca
    Então recebo resposta com status 403
