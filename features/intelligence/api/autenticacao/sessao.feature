# language: pt
@intelligence @api @authentication
Funcionalidade: Sessão da API do Intelligence
  Como QA do Intelligence
  Quero validar a criação e rejeição de sessões
  Para garantir que apenas credenciais válidas iniciem uma sessão

  @negative @regression @release-5.5.0.5062 @case-API-NEG-LOGIN-01
  Cenário: Negação de acesso com usuário inválido
    Dado que possuo credenciais com usuário inválido
    Quando autentico na API do Intelligence
    Então recebo resposta com status 401

  @negative @regression @release-5.5.0.5062 @case-API-NEG-LOGIN-02
  Cenário: Negação de acesso com senha inválida
    Dado que possuo credenciais com senha inválida
    Quando autentico na API do Intelligence
    Então recebo resposta com status 401
