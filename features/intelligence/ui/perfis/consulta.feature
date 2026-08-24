# language: pt
@intelligence @ui @profile
Funcionalidade: Visualização de perfil
  Como usuário autorizado do Intelligence
  Quero abrir perfis diretamente e navegar por seu histórico
  Para consultar os dados disponíveis para meu nível de acesso

  @positive @regression @release-5.5.0.5062 @int-17 @admin @permission-intelligence_user @case-INT-17-PGUID-UI
  Cenário: Abertura de perfil por deep-link com PGUID válido
    Dado que acesso deep-link de perfil com PGUID válido
    Quando a página carrega
    Então visualizo os dados do perfil

  @positive @regression @release-5.5.0.5062 @int-24 @introduced-in-2.0.0 @admin @case-INT-24-UI-01
  Cenário: Navegação entre perfis no histórico de visualizações
    Dado que visualizei múltiplos perfis
    E clico no botão de histórico
    Quando seleciono um perfil anterior
    Então visualizo os dados daquele perfil

  @positive @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @readonly @case-INT-100-I2
  Cenário: Apresentação de perfil em modo somente leitura
    Dado que sou usuário view-only
    E acesso um perfil
    Quando a página carrega
    Então visualizo dados em modo somente leitura sem controles de escrita

  @negative @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @not-found @hardening @case-INT-100-I3
  Cenário: Tratamento de erro para PGUID não encontrado
    Dado que acesso deep-link com PGUID inexistente
    Quando a página tenta carregar
    Então visualizo mensagem de erro apropriada
