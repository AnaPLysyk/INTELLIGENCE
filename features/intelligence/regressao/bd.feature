# language: pt
@intelligence @bd @regression @release-5.5.0.5062
Funcionalidade: Fonte de dados SMART somente leitura
  Como QA do Intelligence
  Quero usar o banco SMART apenas como fonte de massa
  Para validar dados sem risco de escrita

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @smoke
    Exemplos: Conectividade
      | id                   |
      | BD-POS-CONNECTION-01 |

    @positive @int-17
    Exemplos: Massa indexada
      | id              |
      | BD-POS-MASSA-01 |

    @negative @destructive @security
    Exemplos: Escrita proibida
      | id                |
      | BD-DES-INSERT-01  |
      | BD-DES-UPDATE-01  |
      | BD-DES-DELETE-01  |
      | BD-DES-STACKED-01 |
