# language: pt
@intelligence @ui @navigation @viewonly @permission-intelligence_view_only
Funcionalidade: Navegação do modo somente leitura
  Como usuário somente leitura
  Quero retornar para a tela informativa pelas rotas de navegação permitidas
  Para permanecer dentro do fluxo autorizado

  Esquema do Cenário: <id>
    Dado que o caso "<id>" está preparado
    Quando executo o comportamento automatizado do caso
    Então o contrato automatizado deve ser atendido

    @acceptance @regression @int-100 @case-INT-100-I7 @release-unassigned @not-found
    Exemplos: Redirecionamento de 404 para tela inicial
      | id         |
      | INT-100-I7 |

    @acceptance @regression @int-100 @case-INT-100-I6 @release-unassigned @header
    Exemplos: Navegação para home pelo clique no logo
      | id         |
      | INT-100-I6 |
