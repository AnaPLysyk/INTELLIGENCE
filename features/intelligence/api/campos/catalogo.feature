# language: pt
@intelligence @api @fields
Funcionalidade: Catálogo de campos pesquisáveis
  Como QA do Intelligence
  Quero validar o catálogo de campos disponibilizado pela API
  Para garantir configuração consistente e protegida por sessão

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @positive @regression @release-5.5.0.5062 @int-23 @admin @permission-intelligence_user
    Exemplos: Catálogo de campos carregado com sucesso
      | id                |
      | API-POS-FIELDS-01 |

    @negative @regression @release-5.5.0.5062 @int-23
    Exemplos: Proteção de catálogo contra acesso não autenticado
      | id                     |
      | API-NEG-FIELDS-AUTH-01 |
      | API-NEG-FIELDS-AUTH-02 |
