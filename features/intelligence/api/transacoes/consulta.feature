# language: pt
@intelligence @api @transaction
Funcionalidade: Consulta de transação pela API
  Como QA do Intelligence
  Quero consultar transações pelo TGUID
  Para validar detalhes e proteção do endpoint

  @positive @regression @release-5.5.0.5062 @int-17 @admin @permission-intelligence_user @case-API-POS-TGUID-01
  Cenário: Retorno de transação por TGUID válido
    Dado que tenho credenciais de administrador
    E um TGUID válido de transação
    Quando consulto a transação pela API
    Então recebo resposta com status 200
    E os dados da transação são retornados

  @negative @regression @release-5.5.0.5062 @int-17 @case-API-NEG-TRANSACTION-AUTH-01
  Cenário: Bloqueio de consulta sem autenticação
    Dado que não possuo sessão autenticada
    E um TGUID válido de transação
    Quando consulto a transação pela API
    Então recebo resposta com status 401 ou 403

  @negative @regression @release-5.5.0.5062 @admin @permission-intelligence_user @case-API-NEG-TGUID-01
  Cenário: Rejeição de TGUID malformado
    Dado que tenho credenciais de administrador
    E um TGUID em formato inválido
    Quando consulto a transação pela API
    Então recebo resposta com status 400
