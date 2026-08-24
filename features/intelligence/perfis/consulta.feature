# language: pt
@regressao1.13.0 @release-1.13.0 @regression @perfis-consulta
Funcionalidade: Consulta de perfil de usuário
  Como usuário do Intelligence
  Quero consultar perfis de pessoas no sistema
  Para acessar informações biográficas e históricas

  Regra: Qualquer perfil pode consultar (com permissão)

    @admin @api @profile @positive @pw-CONSULTA-PERFIL-01
    Cenário: Admin consulta perfil por PGUID
      Dado que existe admin autenticado
      E existe perfil no banco
      Quando consulta perfil pela API
      Então retorna dados completos com HTTP 200

    @viewonly @api @profile @positive @pw-CONSULTA-PERFIL-02
    Cenário: View-only consulta perfil por PGUID
      Dado que existe view-only autenticado
      Quando consulta perfil conhecida pela API
      Então retorna dados completos com HTTP 200

  Regra: Perfil inexistente retorna 404

    @api @profile @negative @pw-CONSULTA-PERFIL-03
    Cenário: PGUID inexistente retorna 404
      Dado que existe usuário autenticado
      Quando consulta PGUID aleatório
      Então retorna HTTP 404
