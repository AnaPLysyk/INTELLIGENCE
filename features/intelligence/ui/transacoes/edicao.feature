# language: pt
@intelligence @ui @transaction @editing
Funcionalidade: Edição de transação
  Como usuário com acesso de edição
  Quero editar apenas campos permitidos e preservar seus valores
  Para manter integridade e usabilidade da transação

  @positive @regression @release-5.5.0.5062 @int-31 @introduced-in-1.8.1 @admin @biographics @case-INT-31-UI-01
  Cenário: Bloqueio de edição dos campos-chave da transação
    Dado que sou usuário administrador
    E acesso uma transação com campos-chave e biográficos
    Quando abro a edição da transação
    Então os campos-chave não ficam disponíveis para edição
    E ao menos um campo biográfico permanece editável

  @positive @regression @release-5.5.0.5062 @int-40 @introduced-in-1.8.2 @admin @date @case-INT-40-UI-01
  Cenário: Campo de data permanece preenchido ao abrir a edição da transação
    Dado que sou usuário administrador
    E acesso uma transação com campo de data preenchido
    Quando abro a edição da transação
    Então o campo de data permanece preenchido

  @positive @regression @release-5.5.0.5062 @int-32 @admin @date @case-INT-32-UI-01
  Cenário: Disponibilização de calendário em campo de data da transação
    Dado que sou usuário administrador
    E acesso uma transação com campo de data
    Quando abro a edição da transação
    Então o campo de data disponibiliza controle de calendário

  @negative @coverage-gap @int-33 @introduced-in-1.8.1 @admin @specification @case-INT-33-SPEC-01
  Cenário: Validação aguarda regra de negócio documentada
    Dado que sou usuário administrador
    E insiro valor que precisa de validação
    Quando submeto o formulário
    Então o sistema aguarda especificação da regra
