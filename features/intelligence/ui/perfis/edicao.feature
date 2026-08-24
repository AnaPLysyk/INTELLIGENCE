# language: pt
@intelligence @ui @profile @editing
Funcionalidade: Edição de perfil
  Como usuário com acesso de edição
  Quero preservar os valores apresentados ao abrir a edição
  Para evitar perda ou alteração involuntária de dados

  @positive @regression @release-5.5.0.5062 @int-40 @introduced-in-1.8.2 @admin @date
  Cenário: Campo de data permanece preenchido ao editar um perfil
    Dado que o caso "INT-40-UI-02" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido
