# language: pt
@intelligence @ui @transaction @export @nist
Funcionalidade: Exportação NIST da transação
  Como usuário autorizado do Intelligence
  Quero exportar a transação em NIST
  Para obter o arquivo sem falha e com contrato verificável

  @positive @regression @release-5.5.0.5062 @int-30 @introduced-in-2.0.0 @admin
  Cenário: Usuário admin exporta transação em formato NIST com sucesso
    Dado que o caso "INT-30-UI-01" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

  @negative @coverage-gap @int-30 @introduced-in-2.0.0 @admin
  Cenário: Exportação NIST aguarda especificação de tipo de imagem interno
    Dado que o caso "INT-30-NIST-02" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido
