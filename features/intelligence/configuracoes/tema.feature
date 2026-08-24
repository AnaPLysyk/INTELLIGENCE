# language: pt
@regressao1.13.0 @release-1.13.0 @regression @configuracoes-tema
Funcionalidade: Configuração de tema
  Como usuário do Intelligence
  Quero escolher tema claro ou escuro
  Para usar a interface conforme minha preferência

  Regra: Qualquer usuário pode mudar tema

    @admin @ui @settings @smoke @pw-TEMA-ADMIN-01
    Cenário: Admin muda para tema escuro
      Dado que existe admin autenticado
      Quando abre configurações
      E seleciona tema escuro
      Então interface muda para tema escuro

    @viewonly @ui @settings @pw-TEMA-VIEWONLY-01
    Cenário: View-only também pode mudar tema
      Dado que existe view-only autenticado
      Quando abre configurações
      E seleciona tema claro
      Então interface muda para tema claro

  Regra: Preferência é persistida

    @ui @settings @pw-TEMA-PERSISTENCIA-01
    Cenário: Tema persiste após logout
      Dado que escolhi tema escuro
      Quando faço logout e login novamente
      Então tema continua escuro
