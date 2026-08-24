# Arquitetura de testes

A arquitetura oficial do projeto é Cucumber-first. Os Step Definitions são a suíte executável; Playwright fornece browser, request context e assertions, sem uma segunda árvore de `.spec.ts`.

A organização física das **Features é por camada técnica e domínio da aplicação**. Suite, release, ticket e permissão são metadados de execução e ficam em tags.

```text
INTELLIGENCE/
├── features/
│   └── intelligence/
│       ├── api/
│       │   ├── autenticacao/
│       │   ├── busca/
│       │   ├── campos/
│       │   ├── perfis/
│       │   └── transacoes/
│       ├── ui/
│       │   ├── autenticacao/
│       │   ├── busca/
│       │   ├── configuracoes/
│       │   ├── navegacao/
│       │   ├── perfis/
│       │   └── transacoes/
│       └── bd/
│           └── smart/
│               ├── conexao.feature
│               └── tabelas/
│                   └── process.feature
├── steps/
│   └── intelligence/
│       ├── api/{positivo,negativo}/
│       ├── ui/{positivo,negativo}/
│       ├── bd/{positivo,negativo}/
│       └── common/
├── pom/intelligence/
├── utils/
├── config/
├── cucumber/
└── scripts/
```

## Regra de organização

- Pasta de Feature responde **onde/o que** é validado: `api`, `ui`, `bd` e o domínio real (`perfis`, `transacoes`, `busca`, tabela etc.).
- Tags respondem **como/quando/com qual contexto** executar: `@regression`, `@smoke`, `@release-*`, `@int-*`, `@admin`, `@viewonly`, `@permission-*`.
- `regressao`, `smoke`, `release`, ticket e permissões não viram diretórios.
- Em BD, quando a validação é específica de uma tabela, o nome da tabela aparece na estrutura, por exemplo `bd/smart/tabelas/process.feature`.
- Uma Feature pode conter cenários de vários tickets quando todos pertencem ao mesmo comportamento da aplicação.

## Permissões

Quando a permissão técnica está comprovada, ela é registrada literalmente em tag, por exemplo `@permission-intelligence_view_only`. Tags como `@admin`, `@viewonly` e `@no-access` descrevem o perfil usado. Não inventar nome de grupo LDAP/Ranger se o vínculo real não estiver confirmado.

## Responsabilidades

- `features/`: comportamento e rastreabilidade.
- `steps/`: testes executáveis e assertions, separados por API/UI/BD e positivo/negativo.
- `pom/`: implementação visual reutilizável.
- `utils/`: API, banco, autenticação, dados, integrações e provisionamento.
- `cucumber/`: World, Hooks, browser/request contexts, evidências e cleanup.
- `scripts/`: ferramentas operacionais e integração com o QA Orchestrator.

O validador estrutural bloqueia o retorno de `support/`, `tests/`, `.spec.ts`, bridge `@pw-*` e também Features organizadas por `regressao` ou `permissoes`.
