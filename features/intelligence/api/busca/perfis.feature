# language: pt
@intelligence @api @search @profile
Funcionalidade: Busca de perfis pela API
  Como QA do Intelligence
  Quero validar pesquisa, paginação, autorização e robustez da busca de perfis
  Para garantir resultados corretos sem expor dados indevidamente

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular
    Exemplos: Sucesso em busca por diferentes critérios
      | id                    |
      | API-POS-EXTERNAL-01   |
      | API-POS-BIRTHDATE-01  |
      | API-POS-NAME-01       |
      | API-POS-CIB-01        |
      | API-POS-PAGINATION-01 |

    @positive @regression @smoke @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular
    Exemplos: Smoke - Busca rápida por CPF
      | id             |
      | API-POS-CPF-01 |

    @negative @regression @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular
    Exemplos: Rejeição de critérios inválidos e resultados vazios
      | id                       |
      | API-NEG-NOTFOUND-01      |
      | API-NEG-PAYLOAD-NAME-01  |
      | API-NEG-PAYLOAD-VALUE-01 |
      | API-NEG-PAYLOAD-KIND-01  |
      | API-NEG-PAGINATION-01    |

    @negative @regression @smoke @release-5.5.0.5062
    Exemplos: Proteção contra sessão inválida ou ausente
      | id                |
      | API-NEG-COMMON-04 |
      | API-NEG-COMMON-05 |

    @negative @regression @destructive @security @release-5.5.0.5062 @admin @permission-intelligence_user @permission-intelligence_list_regular
    Exemplos: Proteção contra injeção SQL, XSS e payloads maliciosos
      | id                  |
      | API-DES-SQLI-01     |
      | API-DES-XSS-01      |
      | API-DES-PATH-01     |
      | API-DES-OVERSIZE-01 |

    @negative @acceptance @regression @int-100 @case-API-NEG-COMMON-06 @release-unassigned @viewonly @permission-intelligence_view_only
    Exemplos: Busca desabilitada para perfil view-only
      | id                |
      | API-NEG-COMMON-06 |
