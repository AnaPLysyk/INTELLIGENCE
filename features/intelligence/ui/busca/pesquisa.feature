# language: pt
@intelligence @ui @search
Funcionalidade: Pesquisa na interface
  Como usuário do Intelligence
  Quero pesquisar apenas quando meu perfil permite
  Para consultar dados sem expor recursos indevidos

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @int-23 @int-98 @admin @permission-intelligence_user @permission-intelligence_list_regular
    Exemplos: Catálogo visual de busca
      | id               |
      | UI-POS-FIELDS-01 |

    @negative @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular
    Exemplos: Pesquisa vazia
      | id              |
      | UI-NEG-EMPTY-01 |

    @negative @regression @destructive @security @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular
    Exemplos: Entrada hostil na interface
      | id            |
      | UI-DES-XSS-01 |

    @positive @acceptance @regression @smoke @int-100 @case-INT-100-I5 @release-unassigned @admin @permission-intelligence_user @permission-intelligence_list_regular
    Exemplos: Busca disponível para acesso completo
      | id         |
      | INT-100-I5 |

    @negative @acceptance @regression @int-100 @case-INT-100-R3 @release-unassigned @viewonly @permission-intelligence_view_only
    Exemplos: Busca bloqueada para somente leitura
      | id         |
      | INT-100-R3 |
