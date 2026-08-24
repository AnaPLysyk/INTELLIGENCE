# language: pt
@intelligence @ui @transaction @export @nist
Funcionalidade: Exportação NIST da transação
  Como usuário autorizado do Intelligence
  Quero exportar a transação em NIST
  Para obter o arquivo sem falha e com contrato verificável

  @positive @regression @release-5.5.0.5062 @int-30 @introduced-in-2.0.0 @admin @case-INT-30-UI-01
  Cenário: Exportação de transação em formato NIST com download
    Dado que sou usuário administrador
    E acesso uma transação com imagens
    Quando clico em exportar para NIST
    Então recebo arquivo NIST para download

  @negative @coverage-gap @int-30 @introduced-in-2.0.0 @admin @case-INT-30-NIST-02
  Cenário: Exportação aguarda especificação de tipo de imagem interno
    Dado que sou usuário administrador
    E acesso transação com tipo de imagem não documentado
    Quando clico em exportar para NIST
    Então o sistema aguarda especificação do tipo interno
