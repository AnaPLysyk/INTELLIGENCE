# language: pt
@intelligence @bd @smart-db @table-process
Funcionalidade: Tabela Process como fonte de massa
  Como automação do Intelligence
  Quero consultar a tabela Process somente em modo leitura
  Para localizar TGUID e PGUID sem risco de alterar a origem

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @int-17
    Exemplos: Seleção de processos como massa de teste
      | id              |
      | BD-POS-MASSA-01 |

    @negative @regression @destructive @security @release-5.5.0.5062
    Exemplos: Bloqueio de INSERT, UPDATE, DELETE e stacked queries
      | id                |
      | BD-DES-INSERT-01  |
      | BD-DES-UPDATE-01  |
      | BD-DES-DELETE-01  |
      | BD-DES-STACKED-01 |
