# language: pt
@intelligence @ui @authentication
Funcionalidade: Acesso à aplicação
  Como usuário do ambiente integrado
  Quero autenticar apenas quando possuo permissão do Intelligence
  Para impedir a criação de sessão para contas não autorizadas

  @negative @acceptance @regression @int-100 @no-access @permission-none @security @case-UI-NEG-AUTH-NOACCESS-01
  Cenário: Negação de acesso à aplicação para conta sem permissão
    Dado que possuo credenciais de usuário sem permissão Intelligence
    Quando tento acessar a aplicação
    Então sou impedido de criar sessão e redirecionado
