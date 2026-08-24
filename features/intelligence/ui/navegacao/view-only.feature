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

    @regression @int-100 @release-unassigned @not-found
    Exemplos: Retorno da página 404
      | id         |
      | INT-100-I7 |

    @regression @int-100 @release-unassigned @header
    Exemplos: Retorno pelo logo da aplicação
      | id         |
      | INT-100-I6 |
