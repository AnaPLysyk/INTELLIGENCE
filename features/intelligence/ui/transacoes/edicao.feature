# language: pt
@intelligence @ui @transaction @editing
Funcionalidade: Edição de transação
  Como usuário com acesso de edição
  Quero editar apenas campos permitidos e preservar seus valores
  Para manter integridade e usabilidade da transação

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @int-31 @introduced-in-1.8.1 @admin @biographics @case-INT-31-UI-01
    Cenário: Salvamento de campos biográficos editáveis
      Dado que sou usuário administrador
      E acesso uma transação
      Quando edito campos biográficos
      Então as alterações são salvas com sucesso

    @positive @regression @release-5.5.0.5062 @int-40 @introduced-in-1.8.2 @admin @date @case-INT-40-UI-01
    Cenário: Persistência de datas após edição
      Dado que sou usuário administrador
      E acesso uma transação com campo de data
      Quando edito a data
      Então a data é salva e persiste após recarregar

    @positive @regression @release-5.5.0.5062 @int-32 @admin @date @case-INT-32-UI-01
    Cenário: Seleção de data via picker de calendário
      Dado que sou usuário administrador
      E acesso um campo de data
      Quando clico no campo para abrir picker
      Então consigo selecionar data via calendário

    @negative @coverage-gap @int-33 @introduced-in-1.8.1 @admin @specification @case-INT-33-SPEC-01
    Cenário: Validação aguarda regra de negócio documentada
      Dado que sou usuário administrador
      E insiro valor que precisa de validação
      Quando submeto o formulário
      Então o sistema aguarda especificação da regra
