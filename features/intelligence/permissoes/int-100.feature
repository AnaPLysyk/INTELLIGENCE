# language: pt
@int-100 @regression @release-unassigned
Funcionalidade: Acesso somente leitura por URL
  Como usuário do Intelligence com permissão somente leitura
  Quero acessar perfis e transações diretamente pela URL
  Para consultar informações sem pesquisar e sem alterar dados

  Contexto:
    Dado que o cenário está vinculado ao ticket "INT-100"

  @admin @search
  Cenário: Usuário com acesso completo mantém a busca disponível
    Quando o cenário Playwright "INT-100-I5" for executado
    Então o resultado Playwright deve ser aprovado

  @admin @transaction @deeplink
  Cenário: Usuário com acesso completo abre a transação diretamente pela URL
    Quando o cenário Playwright "INT-100-BASELINE" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @api @search @negative
  Cenário: Usuário somente leitura não pode pesquisar pela API
    Quando o cenário Playwright "API-NEG-COMMON-06" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @api @profile @not-found
  Cenário: Perfil inexistente não provoca erro interno
    Quando o cenário Playwright "API-NEG-PROFILE-NOTFOUND-01" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @api @security
  Cenário: Operações de alteração são bloqueadas para somente leitura
    Quando o cenário Playwright "INT-100-WRITE-ENDPOINTS-01" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @api @profile @positive
  Cenário: Usuário somente leitura consulta perfil por PGUID
    Quando o cenário Playwright "API-POS-PROFILE-VIEWONLY-01" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @ui @search
  Cenário: Rotas de busca permanecem bloqueadas no modo somente leitura
    Quando o cenário Playwright "INT-100-R3" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @ui @navigation @not-found
  Cenário: Usuário retorna da página 404 para a tela informativa
    Quando o cenário Playwright "INT-100-I7" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @ui @profile @not-found
  Cenário: Perfil inexistente mantém o tratamento visual esperado
    Quando o cenário Playwright "INT-100-I3" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @ui @navigation
  Cenário: Logo do cabeçalho retorna para a tela informativa
    Quando o cenário Playwright "INT-100-I6" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @ui @settings
  Cenário: Configurações permitidas permanecem acessíveis
    Quando o cenário Playwright "INT-100-I4" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @ui @transaction @readonly
  Cenário: Transação é exibida sem controles de escrita
    Quando o cenário Playwright "INT-100-I1" for executado
    Então o resultado Playwright deve ser aprovado

  @viewonly @ui @profile @readonly
  Cenário: Perfil é exibido sem controles de escrita
    Quando o cenário Playwright "INT-100-I2" for executado
    Então o resultado Playwright deve ser aprovado

  @no-access @ui @security @authentication
  Cenário: Usuário sem permissão não cria sessão no Intelligence
    Quando o cenário Playwright "UI-NEG-AUTH-NOACCESS-01" for executado
    Então o resultado Playwright deve ser aprovado
