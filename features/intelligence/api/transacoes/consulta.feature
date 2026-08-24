# language: pt
@intelligence @api @transaction
Funcionalidade: Consulta de transação pela API
  Como QA do Intelligence
  Quero consultar transações pelo TGUID
  Para validar detalhes e proteção do endpoint

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @int-17 @admin @permission-intelligence_user
    Exemplos: Retorno de transação por TGUID válido
      | id               |
      | API-POS-TGUID-01 |

    @negative @regression @release-5.5.0.5062 @int-17
    Exemplos: Bloqueio de consulta sem autenticação
      | id                          |
      | API-NEG-TRANSACTION-AUTH-01 |

    @negative @regression @release-5.5.0.5062 @admin @permission-intelligence_user
    Exemplos: Rejeição de TGUID malformado
      | id               |
      | API-NEG-TGUID-01 |
