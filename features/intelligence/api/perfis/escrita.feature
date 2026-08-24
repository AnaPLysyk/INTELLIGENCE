# language: pt
@intelligence @api @profile @security @write-endpoints
Funcionalidade: Proteção das operações de escrita de perfil
  Como usuário somente leitura
  Quero ter operações de escrita bloqueadas
  Para impedir alteração de dados sem permissão explícita

  @negative @acceptance @coverage-gap @int-100 @case-INT-100-WRITE-ENDPOINTS-01 @release-unassigned @viewonly @permission-intelligence_view_only
  Cenário: Contrato dos endpoints de escrita precisa estar confirmado antes da automação
    Dado que o caso "INT-100-WRITE-ENDPOINTS-01" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido
