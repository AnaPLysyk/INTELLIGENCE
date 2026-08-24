# language: pt
@intelligence @bd @smart-db @table-process
Funcionalidade: Tabela Process como fonte de massa
  Como automação do Intelligence
  Quero consultar a tabela Process somente em modo leitura
  Para localizar TGUID e PGUID sem risco de alterar a origem

  @positive @regression @release-5.5.0.5062 @int-17 @case-BD-POS-MASSA-01
  Cenário: Seleção de processos como massa de teste
    Dado que tenho conexão de leitura ao banco SMART
    Quando consulto tabela Process para massa
    Então obtenho processos válidos para teste

  @negative @regression @destructive @security @release-5.5.0.5062 @case-BD-DES-INSERT-01
  Cenário: Bloqueio de INSERT na tabela Process
    Dado que tenho credenciais de leitura
    Quando executo INSERT na tabela Process
    Então recebo erro de permissão

  @negative @regression @destructive @security @release-5.5.0.5062 @case-BD-DES-UPDATE-01
  Cenário: Bloqueio de UPDATE na tabela Process
    Dado que tenho credenciais de leitura
    Quando executo UPDATE na tabela Process
    Então recebo erro de permissão

  @negative @regression @destructive @security @release-5.5.0.5062 @case-BD-DES-DELETE-01
  Cenário: Bloqueio de DELETE na tabela Process
    Dado que tenho credenciais de leitura
    Quando executo DELETE na tabela Process
    Então recebo erro de permissão

  @negative @regression @destructive @security @release-5.5.0.5062 @case-BD-DES-STACKED-01
  Cenário: Bloqueio de stacked queries na tabela Process
    Dado que tenho credenciais de leitura
    Quando executo stacked query com comando malicioso
    Então recebo erro ou query é bloqueada
