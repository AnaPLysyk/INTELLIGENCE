# language: pt
@intelligence @api @authentication
Funcionalidade: Sessão da API do Intelligence
  Como QA do Intelligence
  Quero validar a criação e rejeição de sessões
  Para garantir que apenas credenciais válidas iniciem uma sessão

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @negative @regression @release-5.5.0.5062
    Exemplos: Negação de acesso com credenciais inválidas
      | id               |
      | API-NEG-LOGIN-01 |
      | API-NEG-LOGIN-02 |
