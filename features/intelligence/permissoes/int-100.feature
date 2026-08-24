# language: pt
@int-100 @release-unassigned
Funcionalidade: Acesso somente leitura por URL
  Como usuário do Intelligence com permissão somente leitura
  Quero consultar perfis e transações diretamente pela URL
  Para acessar informações sem pesquisar e sem alterar dados

  Regra: Acesso completo mantém os recursos normais

    @regression @admin @ui @search @smoke @case-INT-100-I5
    Cenário: Busca continua disponível para acesso completo
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @admin @ui @transaction @deeplink @smoke @case-INT-100-BASELINE
    Cenário: Transação abre diretamente pelo TGUID
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

  Regra: Somente leitura pode consultar, mas não pesquisar nem alterar

    @regression @viewonly @api @search @negative @case-API-NEG-COMMON-06
    Cenário: API de busca é negada ao somente leitura
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @api @profile @not-found @negative @case-API-NEG-PROFILE-NOTFOUND-01
    Cenário: Perfil inexistente não gera erro interno
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @viewonly @api @security @write-endpoints @negative @coverage-gap @case-INT-100-WRITE-ENDPOINTS-01
    Cenário: Operações de escrita aguardam contrato seguro
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @api @profile @positive @case-API-POS-PROFILE-VIEWONLY-01
    Cenário: Perfil conhecido pode ser consultado pela API
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @ui @search @negative @case-INT-100-R3
    Cenário: Rotas de busca permanecem bloqueadas
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @ui @navigation @not-found @case-INT-100-I7
    Cenário: Voltar da página 404 retorna para a tela informativa
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @ui @profile @not-found @hardening @case-INT-100-I3
    Cenário: Perfil inexistente preserva o tratamento visual
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @ui @navigation @header @case-INT-100-I6
    Cenário: Logo do cabeçalho retorna para a tela informativa
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @ui @settings @case-INT-100-I4
    Cenário: Configurações permitidas continuam acessíveis
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @ui @transaction @readonly @case-INT-100-I1
    Cenário: Transação é exibida sem controles de escrita
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

    @regression @viewonly @ui @profile @readonly @case-INT-100-I2
    Cenário: Perfil é exibido sem controles de escrita
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido

  Regra: Sem permissão não entra no Intelligence

    @regression @no-access @ui @security @authentication @negative @case-UI-NEG-AUTH-NOACCESS-01
    Cenário: Conta sem permissão não cria sessão
      Dado que o caso automatizado está preparado
      Quando executo o comportamento automatizado do caso
      Então o contrato automatizado deve ser atendido
