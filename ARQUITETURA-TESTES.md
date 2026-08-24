# Arquitetura de testes

A arquitetura oficial é Cucumber-first. Os Step Definitions são a suíte executável; Playwright fornece browser, request context e assertions.

## Features

A organização física das Features é por camada técnica e domínio da aplicação. Suite, release, ticket, perfil e permissão são tags.

```text
features/intelligence/
├── api/
├── ui/
└── bd/
```

## Steps

A organização dos Steps segue a responsabilidade própria de cada camada:

```text
steps/intelligence/
├── api/
│   ├── autenticar/
│   │   └── sessao.steps.ts
│   ├── buscar/
│   │   └── perfis.steps.ts
│   ├── consultar/
│   │   ├── campos.steps.ts
│   │   ├── perfis.steps.ts
│   │   └── transacoes.steps.ts
│   └── escrever/
│       └── perfis.steps.ts
├── ui/
│   ├── autenticacao/acesso.steps.ts
│   ├── busca/pesquisa.steps.ts
│   ├── configuracoes/preferencias.steps.ts
│   ├── navegacao/view-only.steps.ts
│   ├── perfis/
│   │   ├── consulta.steps.ts
│   │   └── edicao.steps.ts
│   └── transacoes/
│       ├── detalhes.steps.ts
│       ├── edicao.steps.ts
│       └── exportacao.steps.ts
├── bd/
│   └── smart/
│       ├── conexao.steps.ts
│       └── tabelas/
│           └── process.steps.ts
└── common/
    └── case.steps.ts
```

### API

A primeira pasta é a operação executada contra o backend; o arquivo representa o recurso.

Exemplos: `api/buscar/perfis.steps.ts`, `api/consultar/transacoes.steps.ts` e `api/escrever/perfis.steps.ts`.

### UI

A pasta representa uma tela ou área navegável do Intelligence. O arquivo representa o comportamento daquela tela.

Exemplos: `ui/busca/pesquisa.steps.ts`, `ui/perfis/consulta.steps.ts` e `ui/transacoes/edicao.steps.ts`.

### BD

A estrutura é banco → tabela. Validações de conectividade que não pertencem a uma tabela ficam diretamente no banco.

Exemplos: `bd/smart/conexao.steps.ts` e `bd/smart/tabelas/process.steps.ts`.

## Metadados

`positivo`, `negativo`, `regressao`, `smoke`, `release`, ticket e permissão não são pastas. Esses conceitos são tags Cucumber como `@positive`, `@negative`, `@regression`, `@smoke`, `@release-*`, `@int-*` e `@permission-*`.

## Runtime compilado

`.cucumber-dist` é artefato efêmero. Ele é removido antes de cada build Cucumber, inclusive quando a execução entra pelo `orchestrator.cjs`. Isso impede que arquivos JavaScript compilados de uma estrutura antiga sejam carregados junto com a estrutura atual.

## Responsabilidades

- `features/`: comportamento e rastreabilidade.
- `steps/`: testes executáveis e assertions.
- `pom/`: implementação visual reutilizável.
- `utils/`: API, banco, autenticação, dados, integrações e provisionamento.
- `cucumber/`: World, Hooks, contexts, evidências e cleanup.
- `scripts/`: ferramentas operacionais e integração com o QA Orchestrator.

O validador bloqueia `support/`, `tests/`, `.spec.ts`, bridge `@pw-*`, pastas de metadados e `regressao.steps.ts` genérico.
