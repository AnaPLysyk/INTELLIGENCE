# language: pt
@intelligence @api @regression @release-5.5.0.5062
Funcionalidade: Contratos de API do Intelligence
  Como QA do Intelligence
  Quero validar contratos HTTP, autorização e robustez
  Para detectar regressões sem alterar dados reais

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive
    Exemplos: Casos positivos
      | id                    |
      | API-POS-EXTERNAL-01   |
      | API-POS-BIRTHDATE-01  |
      | API-POS-NAME-01       |
      | API-POS-CIB-01        |
      | API-POS-PAGINATION-01 |

    @positive @smoke
    Exemplos: Smoke de busca
      | id             |
      | API-POS-CPF-01 |

    @positive @int-23
    Exemplos: Catálogo de campos
      | id                |
      | API-POS-FIELDS-01 |

    @positive @int-17
    Exemplos: Detalhes de transação
      | id               |
      | API-POS-TGUID-01 |

    @negative
    Exemplos: Validações negativas
      | id                       |
      | API-NEG-NOTFOUND-01      |
      | API-NEG-LOGIN-01         |
      | API-NEG-LOGIN-02         |
      | API-NEG-PAYLOAD-NAME-01  |
      | API-NEG-PAYLOAD-VALUE-01 |
      | API-NEG-PAYLOAD-KIND-01  |
      | API-NEG-TGUID-01         |
      | API-NEG-PAGINATION-01    |

    @negative @int-23
    Exemplos: Proteção do catálogo
      | id                     |
      | API-NEG-FIELDS-AUTH-01 |
      | API-NEG-FIELDS-AUTH-02 |

    @negative @int-17
    Exemplos: Proteção de transação
      | id                          |
      | API-NEG-TRANSACTION-AUTH-01 |

    @negative @smoke
    Exemplos: Smoke de autenticação
      | id                |
      | API-NEG-COMMON-04 |
      | API-NEG-COMMON-05 |

    @negative @destructive @security
    Exemplos: Robustez hostil
      | id                  |
      | API-DES-SQLI-01     |
      | API-DES-XSS-01      |
      | API-DES-PATH-01     |
      | API-DES-OVERSIZE-01 |
