# language: pt
@intelligence @api @profile @security @write-endpoints
Funcionalidade: Proteção das operações de escrita de perfil
  Como usuário somente leitura
  Quero ter operações de escrita bloqueadas
  Para impedir alteração de dados sem permissão explícita

  @negative @acceptance @coverage-gap @int-100 @viewonly @permission-intelligence_view_only @case-INT-100-WRITE-ENDPOINTS-01
  Cenário: Bloqueio de escrita em endpoints de perfil para usuário view-only
    Dado que tenho permissão view-only
    Quando executo requisições POST/PUT para endpoints de escrita
    Então todas as requisições retornam status 403
