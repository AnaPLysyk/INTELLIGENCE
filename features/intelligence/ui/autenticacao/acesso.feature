# language: pt
@intelligence @ui @authentication
Funcionalidade: Acesso à aplicação
  Como usuário do ambiente integrado
  Quero autenticar apenas quando possuo permissão do Intelligence
  Para impedir a criação de sessão para contas não autorizadas

  @negative @regression @int-100 @release-unassigned @no-access @permission-none @security
  Cenário: Conta sem permissão não cria sessão do Intelligence
    Dado que o caso "UI-NEG-AUTH-NOACCESS-01" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido
