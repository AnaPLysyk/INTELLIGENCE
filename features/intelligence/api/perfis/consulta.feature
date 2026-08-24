# language: pt
@intelligence @api @profile
Funcionalidade: Consulta direta de perfil
  Como usuário autorizado do Intelligence
  Quero consultar um perfil diretamente pelo PGUID
  Para visualizar dados sem depender da busca

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @int-100 @release-unassigned @viewonly @permission-intelligence_view_only
    Exemplos: Perfil conhecido em somente leitura
      | id                              |
      | API-POS-PROFILE-VIEWONLY-01     |

    @negative @regression @int-100 @release-unassigned @viewonly @permission-intelligence_view_only @not-found
    Exemplos: Perfil inexistente sem erro interno
      | id                              |
      | API-NEG-PROFILE-NOTFOUND-01     |
