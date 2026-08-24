# language: pt
@regressao1.13.0 @release-1.13.0 @regression @processos-criminais
Funcionalidade: Processos Criminais
  Como investigador ou gestor
  Quero buscar e analisar processos criminais
  Para investigar e documentar casos

  Regra: Investigador tem acesso completo

    @investigador @api @processo @search @smoke @pw-CRIMINAL-BUSCA-01
    Cenário: Busca processo criminal por número
      Dado que existe investigador autenticado
      E existe processo criminal no banco
      Quando busca pelo número do processo
      Então retorna processo com todos os dados

    @investigador @ui @processo @search @smoke @pw-CRIMINAL-BUSCA-02
    Cenário: Interface de busca de criminais disponível
      Dado que existe investigador autenticado
      Quando acessa a seção de processos criminais
      Então busca e filtros estão disponíveis

  Regra: Gestor visualiza com restrições

    @gestor @ui @processo @readonly @pw-CRIMINAL-VISUALIZA-01
    Cenário: Gestor vê processos sem editar
      Dado que existe gestor autenticado
      Quando abre processo criminal
      Então visualiza dados sem controles de escrita

  Regra: Sem permissão não acessa

    @no-access @ui @processo @security @negative @pw-CRIMINAL-ACESSO-NEGADO-01
    Cenário: Sem permissão bloqueia acesso
      Dado que existe usuário sem permissão
      Quando tenta acessar processos criminais
      Então é redirecionado para tela informativa
