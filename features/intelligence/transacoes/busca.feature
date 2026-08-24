# language: pt
@regressao1.13.0 @release-1.13.0 @regression @transacoes-busca
Funcionalidade: Busca de transações
  Como usuário do Intelligence
  Quero buscar transações por diversos critérios
  Para encontrar informações relevantes rapidamente

  Regra: Acesso completo pode buscar

    @admin @api @search @smoke @pw-BUSCA-TRANSACAO-01
    Cenário: Busca por CPF retorna transações
      Dado que existe admin autenticado
      E existe CPF com transações no banco
      Quando chama a API de busca com CPF
      Então retorna lista de transações com HTTP 200

    @admin @ui @search @smoke @pw-BUSCA-TRANSACAO-02
    Cenário: Interface de busca está disponível para admin
      Dado que existe admin autenticado
      Quando acessa a tela principal
      Então campo de busca está visível e ativo

  Regra: View-only não pode buscar

    @viewonly @api @search @negative @pw-BUSCA-TRANSACAO-03
    Cenário: Busca é bloqueada para view-only
      Dado que existe view-only autenticado
      Quando chama a API de busca
      Então retorna HTTP 403 (acesso negado)

    @viewonly @ui @search @negative @pw-BUSCA-TRANSACAO-04
    Cenário: Campo de busca não aparece para view-only
      Dado que existe view-only autenticado
      Quando acessa a tela principal
      Então campo de busca não está visível
