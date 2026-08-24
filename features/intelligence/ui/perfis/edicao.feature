# language: pt
@intelligence @ui @profile @editing
Funcionalidade: Edição de perfil
  Como usuário com acesso de edição
  Quero preservar os valores apresentados ao abrir a edição
  Para evitar perda ou alteração involuntária de dados

  @positive @regression @release-5.5.0.5062 @int-40 @introduced-in-1.8.2 @admin @date @case-INT-40-UI-02
  Cenário: Campo de data permanece preenchido ao abrir a edição do perfil
    Dado que sou usuário administrador
    E acesso um perfil com campo de data preenchido
    Quando abro a edição do perfil
    Então o campo de data permanece preenchido
