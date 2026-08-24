# language: pt
@regressao1.13.0 @release-1.13.0 @regression @configuracoes-idioma
Funcionalidade: Configuração de idioma
  Como usuário do Intelligence
  Quero escolher português ou inglês
  Para usar a interface no meu idioma preferido

  Regra: Suporte a múltiplos idiomas

    @ui @settings @smoke @pw-IDIOMA-MUDANCA-01
    Cenário: Muda interface para inglês
      Dado que estou em português
      Quando abro configurações
      E seleciono English
      Então todos os textos estão em inglês

    @ui @settings @pw-IDIOMA-PERSISTENCIA-01
    Cenário: Idioma persiste entre sessões
      Dado que escolhi English
      Quando faço logout e login novamente
      Então interface está em English
