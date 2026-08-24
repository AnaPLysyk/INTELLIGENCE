# language: pt
@intelligence @api @profile
Funcionalidade: Consulta direta de perfil
  Como usuário autorizado do Intelligence
  Quero consultar um perfil diretamente pelo PGUID
  Para visualizar dados sem depender da busca

  @positive @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @case-API-POS-PROFILE-VIEWONLY-01
  Cenário: Consulta de perfil com sucesso em modo view-only
    Dado que tenho permissão view-only
    E um PGUID válido de perfil
    Quando consulto o perfil pela API
    Então recebo resposta com status 200
    E os dados do perfil são retornados

  @negative @acceptance @regression @int-100 @viewonly @permission-intelligence_view_only @not-found @case-API-NEG-PROFILE-NOTFOUND-01
  Cenário: Retorno de erro para PGUID inexistente no sistema
    Dado que tenho permissão view-only
    E um PGUID que não existe
    Quando consulto o perfil pela API
    Então recebo resposta com status diferente de 500
