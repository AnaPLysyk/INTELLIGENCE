# language: pt
@intelligence @ui @profile
Funcionalidade: Visualização de perfil
  Como usuário autorizado do Intelligence
  Quero abrir perfis diretamente e consultar seu histórico
  Para consultar os dados disponíveis para meu nível de acesso

  @positive @regression @release-5.5.0.5062 @int-17 @admin @permission-intelligence_user @case-INT-17-PGUID-UI
  Cenário: Abertura de perfil por deep-link com PGUID válido
    Dado que acesso deep-link de perfil com PGUID válido
    Quando a página carrega
    Então visualizo os dados do perfil

  @positive @regression @release-5.5.0.5062 @int-24 @introduced-in-2.0.0 @admin @case-INT-24-UI-01
  Cenário: Exibição de PGUIDs anteriores no histórico completo do perfil
    Dado que acesso um perfil com histórico de unificações
    Quando a página do perfil é exibida
    Então visualizo o bloco de histórico de perfis anteriores
    E os PGUIDs do previousHistory são apresentados no histórico

  @positive @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @readonly @case-INT-100-I2
  Cenário: Apresentação de perfil em modo somente leitura
    Dado que sou usuário view-only
    E acesso um perfil
    Quando a página carrega
    Então visualizo dados em modo somente leitura sem controles de escrita

  @negative @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @not-found @hardening @case-INT-100-I3
  Cenário: Tratamento seguro de PGUID inexistente em modo somente leitura
    Dado que sou usuário view-only com acesso a um perfil válido
    E acesso deep-link com PGUID inexistente
    Quando o perfil inexistente é consultado
    Então a resposta não apresenta erro interno
    E a busca continua indisponível
