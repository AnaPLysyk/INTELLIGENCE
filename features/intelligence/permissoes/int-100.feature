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
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-I5"
    Então o vínculo com a automação deve existir

  @admin @transaction @deeplink
  Cenário: Usuário com acesso completo abre a transação diretamente pela URL
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-BASELINE"
    Então o vínculo com a automação deve existir

  @viewonly @api @search @negative
  Cenário: Usuário somente leitura não pode pesquisar pela API
    Quando o cenário visual estiver vinculado ao Playwright "API-NEG-COMMON-06"
    Então o vínculo com a automação deve existir

  @viewonly @api @profile @not-found
  Cenário: Perfil inexistente não provoca erro interno
    Quando o cenário visual estiver vinculado ao Playwright "API-NEG-PROFILE-NOTFOUND-01"
    Então o vínculo com a automação deve existir

  @viewonly @api @security
  Cenário: Operações de alteração são bloqueadas para somente leitura
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-WRITE-ENDPOINTS-01"
    Então o vínculo com a automação deve existir

  @viewonly @api @profile @positive
  Cenário: Usuário somente leitura consulta perfil por PGUID
    Quando o cenário visual estiver vinculado ao Playwright "API-POS-PROFILE-VIEWONLY-01"
    Então o vínculo com a automação deve existir

  @viewonly @ui @search
  Cenário: Rotas de busca permanecem bloqueadas no modo somente leitura
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-R3"
    Então o vínculo com a automação deve existir

  @viewonly @ui @navigation @not-found
  Cenário: Usuário retorna da página 404 para a tela informativa
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-I7"
    Então o vínculo com a automação deve existir

  @viewonly @ui @profile @not-found
  Cenário: Perfil inexistente mantém o tratamento visual esperado
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-I3"
    Então o vínculo com a automação deve existir

  @viewonly @ui @navigation
  Cenário: Logo do cabeçalho retorna para a tela informativa
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-I6"
    Então o vínculo com a automação deve existir

  @viewonly @ui @settings
  Cenário: Configurações permitidas permanecem acessíveis
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-I4"
    Então o vínculo com a automação deve existir

  @viewonly @ui @transaction @readonly
  Cenário: Transação é exibida sem controles de escrita
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-I1"
    Então o vínculo com a automação deve existir

  @viewonly @ui @profile @readonly
  Cenário: Perfil é exibido sem controles de escrita
    Quando o cenário visual estiver vinculado ao Playwright "INT-100-I2"
    Então o vínculo com a automação deve existir

  @no-access @ui @security @authentication
  Cenário: Usuário sem permissão não cria sessão no Intelligence
    Quando o cenário visual estiver vinculado ao Playwright "UI-NEG-AUTH-NOACCESS-01"
    Então o vínculo com a automação deve existir
