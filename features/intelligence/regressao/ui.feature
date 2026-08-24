# language: pt
@intelligence @ui
Funcionalidade: Comportamentos visuais e históricos do Intelligence
  Como QA do Intelligence
  Quero preservar os comportamentos visuais comprovados
  Para detectar regressões de navegação, edição e segurança

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @int-23 @int-98
    Exemplos: Catálogo visual
      | id               |
      | UI-POS-FIELDS-01 |

    @positive @regression @release-5.5.0.5062 @int-17
    Exemplos: Navegação histórica INT-17
      | id              |
      | INT-17-PGUID-UI |

    @positive @regression @release-5.5.0.5062 @int-31 @introduced-in-1.8.1
    Exemplos: Edição INT-31
      | id            |
      | INT-31-UI-01 |

    @positive @regression @release-5.5.0.5062 @int-40 @introduced-in-1.8.2
    Exemplos: Datas INT-40
      | id            |
      | INT-40-UI-01 |
      | INT-40-UI-02 |

    @positive @regression @release-5.5.0.5062 @int-32 @release-unassigned
    Exemplos: Calendário INT-32
      | id            |
      | INT-32-UI-01 |

    @positive @regression @release-5.5.0.5062 @int-24 @introduced-in-2.0.0
    Exemplos: Histórico INT-24
      | id            |
      | INT-24-UI-01 |

    @positive @regression @release-5.5.0.5062 @int-30 @introduced-in-2.0.0
    Exemplos: Exportação INT-30
      | id            |
      | INT-30-UI-01 |

    @negative @regression @release-5.5.0.5062
    Exemplos: Validação visual
      | id              |
      | UI-NEG-EMPTY-01 |

    @negative @regression @release-5.5.0.5062 @destructive @security
    Exemplos: Segurança visual
      | id            |
      | UI-DES-XSS-01 |

    @negative @coverage-gap @int-33 @introduced-in-1.8.1
    Exemplos: Requisito incompleto INT-33
      | id              |
      | INT-33-SPEC-01 |

    @negative @coverage-gap @int-30 @introduced-in-2.0.0
    Exemplos: Regra NIST incompleta
      | id               |
      | INT-30-NIST-02 |
