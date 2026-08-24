# language: pt
@regressao1.13.0 @release-1.13.0 @regression @transacoes-detalhes
Funcionalidade: Detalhes da transação
  Como usuário do Intelligence
  Quero visualizar detalhes completos de uma transação
  Para analisar informações financeiras e históricas

  Regra: Acesso completo vê tudo

    @admin @ui @transaction @smoke @pw-DETALHE-TRANSACAO-01
    Cenário: Detalhes da transação são exibidos
      Dado que existe admin autenticado
      E existe transação no banco
      Quando abre detalhes pelo TGUID
      Então todos os campos são exibidos

  Regra: View-only visualiza sem editar

    @viewonly @ui @transaction @readonly @pw-DETALHE-TRANSACAO-02
    Cenário: Detalhes sem controles de edição
      Dado que existe view-only autenticado
      Quando abre detalhes da transação
      Então detalhes são exibidos sem botões de edição
