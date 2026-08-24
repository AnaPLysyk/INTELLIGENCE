# language: pt
@intelligence @bd @smart-db
Funcionalidade: Conexão somente leitura com o banco SMART
  Como automação do Intelligence
  Quero validar a conexão usada como fonte de massa
  Para garantir acesso ao banco sem alterar dados

  @positive @regression @smoke @release-5.5.0.5062
  Cenário: Consulta mínima confirma a conexão somente leitura
    Dado que o caso "BD-POS-CONNECTION-01" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido
