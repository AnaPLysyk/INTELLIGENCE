# language: pt
@intelligence @ui @search
Funcionalidade: Pesquisa na interface
  Como usuário do Intelligence
  Quero pesquisar apenas quando meu perfil permite
  Para consultar dados sem expor recursos indevidos

  @positive @regression @release-5.5.0.5062 @int-23 @int-98 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-UI-POS-FIELDS-01
  Cenário: Carregamento de catálogo de campos pesquisáveis
    Dado que sou usuário administrador na interface
    Quando acesso a página de busca
    Então visualizo o catálogo completo de campos pesquisáveis

  @negative @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-UI-NEG-EMPTY-01
  Cenário: Rejeição de pesquisa vazia sem critério informado
    Dado que sou usuário administrador na interface
    E estou na página de busca
    Quando clico em pesquisar sem preencher nenhum critério
    Então visualizo mensagem de validação

  @negative @regression @destructive @security @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-UI-DES-XSS-01
  Cenário: Bloqueio de payload XSS em campo de pesquisa
    Dado que sou usuário administrador na interface
    E estou na página de busca
    Quando insiro payload XSS no campo de pesquisa
    Então o payload é bloqueado ou escapado corretamente

  @positive @acceptance @regression @smoke @int-100 @admin @permission-intelligence_user @permission-intelligence_list_regular @case-INT-100-I5
  Cenário: Execução de busca com permissão de administrador
    Dado que sou usuário administrador
    E insiro critério válido de pesquisa
    Quando executo a busca
    Então recebo resultados na interface

  @negative @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @case-INT-100-R3
  Cenário: Ocultação de busca para usuário com acesso view-only
    Dado que sou usuário view-only
    Quando acesso a página principal
    Então a função de busca não é exibida
