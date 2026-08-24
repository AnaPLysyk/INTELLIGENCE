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
    Exemplos: Navegação para perfil vinculado
      | id              |
      | INT-17-PGUID-UI |

    @positive @regression @release-5.5.0.5062 @int-24 @introduced-in-2.0.0 @admin
    Exemplos: Histórico de perfis
      | id            |
      | INT-24-UI-01 |

    @positive @regression @int-100 @release-unassigned @viewonly @permission-intelligence_view_only @readonly
    Exemplos: Perfil em somente leitura
      | id         |
      | INT-100-I2 |

    @negative @regression @int-100 @release-unassigned @viewonly @permission-intelligence_view_only @not-found @hardening
    Exemplos: Perfil inexistente
      | id         |
      | INT-100-I3 |
