# language: pt
@regressao1.13.0 @release-1.13.0 @regression @processos-necros
Funcionalidade: Processos Necros (Óbitos)
  Como investigador ou gestor de óbitos
  Quero buscar e analisar processos relacionados a óbitos
  Para documentar e investigar casos de morte

  Regra: Investigador tem acesso completo

    @investigador @api @processo @search @smoke @pw-NECRO-BUSCA-01
    Cenário: Busca processo necro por número
      Dado que existe investigador autenticado
      E existe processo necro no banco
      Quando busca pelo número do processo
      Então retorna processo com dados de óbito

    @investigador @ui @processo @search @smoke @pw-NECRO-BUSCA-02
    Cenário: Interface de busca de necros disponível
      Dado que existe investigador autenticado
      Quando acessa a seção de processos necros
      Então busca e filtros estão disponíveis

  Regra: Consultor visualiza com restrições

    @consultor @ui @processo @readonly @pw-NECRO-VISUALIZA-01
    Cenário: Consultor vê processos sem editar
      Dado que existe consultor autenticado
      Quando abre processo necro
      Então visualiza dados sem controles de escrita

  Regra: Sem permissão não acessa

    @no-access @ui @processo @security @negative @pw-NECRO-ACESSO-NEGADO-01
    Cenário: Sem permissão bloqueia acesso
      Dado que existe usuário sem permissão
      Quando tenta acessar processos necros
      Então é redirecionado para tela informativa
