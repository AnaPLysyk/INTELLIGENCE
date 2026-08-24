# language: pt
@intelligence @ui @transaction @editing
Funcionalidade: Edição de transação
  Como usuário com acesso de edição
  Quero editar apenas campos permitidos e preservar seus valores
  Para manter integridade e usabilidade da transação

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @int-31 @introduced-in-1.8.1 @admin @biographics
    Exemplos: Campos editáveis INT-31
      | id           |
      | INT-31-UI-01 |

    @positive @regression @release-5.5.0.5062 @int-40 @introduced-in-1.8.2 @admin @date
    Exemplos: Persistência do valor de data
      | id           |
      | INT-40-UI-01 |

    @positive @regression @release-5.5.0.5062 @int-32 @release-unassigned @admin @date
    Exemplos: Calendário de data
      | id           |
      | INT-32-UI-01 |

    @negative @coverage-gap @int-33 @introduced-in-1.8.1 @admin @specification
    Exemplos: Regra de validação incompleta
      | id             |
      | INT-33-SPEC-01 |
