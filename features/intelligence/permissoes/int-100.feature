# language: pt
@int-100 @regression @release-unassigned
Funcionalidade: Acesso somente leitura por URL
  Como usuário do Intelligence com permissão somente leitura
  Quero consultar perfis e transações diretamente pela URL
  Para acessar informações sem pesquisar e sem alterar dados

  Regra: Acesso completo mantém os recursos normais

    @admin @ui @search @smoke @pw-INT-100-I5
    Cenário: Busca continua disponível para acesso completo
      Dado que existe um usuário com acesso completo
      Quando ele acessa o Intelligence pela tela principal
      Então o seletor de busca e o botão Pesquisar devem estar disponíveis

    @admin @ui @transaction @deeplink @smoke @pw-INT-100-BASELINE
    Cenário: Transação abre diretamente pelo TGUID
      Dado que existe um usuário com acesso completo
      Quando ele abre uma transação diretamente pelo TGUID
      Então os detalhes da transação e o TGUID solicitado devem ser exibidos

  Regra: Somente leitura pode consultar, mas não pesquisar nem alterar

    @viewonly @api @search @negative @pw-API-NEG-COMMON-06
    Cenário: API de busca é negada ao somente leitura
      Dado que existe um usuário com permissão somente leitura
      Quando ele chama diretamente os endpoints de count e list
      Então os endpoints de busca devem responder 403

    @viewonly @api @profile @not-found @negative @pw-API-NEG-PROFILE-NOTFOUND-01
    Cenário: Perfil inexistente não gera erro interno
      Dado que existe um usuário com permissão somente leitura
      Quando ele consulta um PGUID inexistente pela API
      Então a API não deve responder 500

    @viewonly @api @security @write-endpoints @negative @pw-INT-100-WRITE-ENDPOINTS-01
    Cenário: Operações de escrita são negadas ao somente leitura
      Dado que existe um usuário com permissão somente leitura
      Quando ele tenta executar operações de escrita
      Então as operações de escrita devem responder 403

    @viewonly @api @profile @positive @pw-API-POS-PROFILE-VIEWONLY-01
    Cenário: Perfil conhecido pode ser consultado pela API
      Dado que existe um usuário com permissão somente leitura
      Quando ele consulta um perfil conhecido pelo PGUID
      Então a API deve retornar o perfil com status 200

    @viewonly @ui @search @negative @pw-INT-100-R3
    Cenário: Rotas de busca permanecem bloqueadas
      Dado que existe um usuário com permissão somente leitura
      Quando ele acessa a raiz, recarrega ou tenta abrir uma rota de busca
      Então a tela informativa deve permanecer visível e a busca não deve aparecer

    @viewonly @ui @navigation @not-found @pw-INT-100-I7
    Cenário: Voltar da página 404 retorna para a tela informativa
      Dado que existe um usuário com permissão somente leitura
      Quando ele acessa uma rota inexistente e seleciona Voltar
      Então a aplicação deve retornar para a tela informativa do modo somente leitura

    @viewonly @ui @profile @not-found @hardening @pw-INT-100-I3
    Cenário: Perfil inexistente preserva o tratamento visual
      Dado que existe um usuário com permissão somente leitura
      Quando ele abre diretamente um perfil inexistente pelo PGUID
      Então a aplicação deve retornar para a tela informativa do modo somente leitura
      E uma indicação de perfil não encontrado deve ser preservada

    @viewonly @ui @navigation @header @pw-INT-100-I6
    Cenário: Logo do cabeçalho retorna para a tela informativa
      Dado que existe um usuário com permissão somente leitura
      Quando ele abre as configurações e seleciona o logo da aplicação
      Então a aplicação deve retornar para a tela informativa do modo somente leitura

    @viewonly @ui @settings @pw-INT-100-I4
    Cenário: Configurações permitidas continuam acessíveis
      Dado que existe um usuário com permissão somente leitura
      Quando ele abre as configurações pelo header
      Então tema, idioma, data, hora e versões devem permanecer disponíveis

    @viewonly @ui @transaction @readonly @pw-INT-100-I1
    Cenário: Transação é exibida sem controles de escrita
      Dado que existe um usuário com permissão somente leitura
      Quando ele abre uma transação diretamente pelo TGUID
      Então a transação solicitada deve ser exibida
      E os controles de escrita não devem ser exibidos

    @viewonly @ui @profile @readonly @pw-INT-100-I2
    Cenário: Perfil é exibido sem controles de escrita
      Dado que existe um usuário com permissão somente leitura
      Quando ele abre um perfil diretamente pelo PGUID
      Então o perfil solicitado deve ser exibido
      E os controles de escrita não devem ser exibidos

  Regra: Sem permissão não entra no Intelligence

    @no-access @ui @security @authentication @negative @pw-UI-NEG-AUTH-NOACCESS-01
    Cenário: Conta sem permissão não cria sessão
      Dado que existe um usuário sem permissão do Intelligence
      Quando ele tenta autenticar na aplicação
      Então nenhuma sessão do Intelligence deve ser criada
