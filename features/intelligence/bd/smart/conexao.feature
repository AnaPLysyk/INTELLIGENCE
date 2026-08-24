# language: pt
@intelligence @bd @smart-db
Funcionalidade: Conexão somente leitura com o banco SMART
  Como automação do Intelligence
  Quero validar a conexão usada como fonte de massa
  Para garantir acesso ao banco sem alterar dados

  @positive @regression @smoke @release-5.5.0.5062 @case-BD-POS-CONNECTION-01
  Cenário: Conexão de leitura com banco SMART disponível
    Dado que tenho credenciais de leitura do banco SMART
    Quando executo consulta de teste
    Então recebo resultado sem erro
