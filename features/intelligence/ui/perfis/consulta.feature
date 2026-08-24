# language: pt
@intelligence @ui @profile
Funcionalidade: Visualização de perfil
  Como usuário autorizado do Intelligence
  Quero abrir perfis diretamente e navegar por seu histórico
  Para consultar os dados disponíveis para meu nível de acesso

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @int-17 @admin @permission-intelligence_user
    Exemplos: Acesso a perfil vinculado por PGUID
      | id              |
      | INT-17-PGUID-UI |

    @positive @regression @release-5.5.0.5062 @int-24 @introduced-in-2.0.0 @admin
    Exemplos: Navegação no histórico de perfis
      | id           |
      | INT-24-UI-01 |

    @positive @acceptance @regression @int-100 @case-INT-100-I2 @release-unassigned @viewonly @permission-intelligence_view_only @readonly
    Exemplos: Perfil carregado em modo somente leitura
      | id         |
      | INT-100-I2 |

    @negative @acceptance @regression @int-100 @case-INT-100-I3 @release-unassigned @viewonly @permission-intelligence_view_only @not-found @hardening
    Exemplos: Mensagem de erro para PGUID inexistente
      | id         |
      | INT-100-I3 |
