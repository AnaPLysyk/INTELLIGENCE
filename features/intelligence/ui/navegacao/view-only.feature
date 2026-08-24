# language: pt
@intelligence @ui @navigation @viewonly @permission-intelligence_view_only
Funcionalidade: Navegação do modo somente leitura
  Como usuário somente leitura
  Quero retornar para a tela informativa pelas rotas de navegação permitidas
  Para permanecer dentro do fluxo autorizado

  @acceptance @regression @int-100 @not-found @case-INT-100-I7
  Cenário: Redirecionamento de 404 para tela inicial
    Dado que sou usuário view-only
    Quando acesso uma rota não existente
    Então sou redirecionado para a página inicial

  @acceptance @regression @int-100 @header @case-INT-100-I6
  Cenário: Navegação para home pelo clique no logo
    Dado que sou usuário view-only
    E estou em qualquer página da aplicação
    Quando clico no logo no header
    Então sou navegado para a página inicial
