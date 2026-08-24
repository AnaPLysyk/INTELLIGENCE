# Arquitetura visual de testes

A reorganização foi feita com baixo impacto: a suíte Playwright existente continua em `tests/` e continua sendo a fonte executável atual. A camada nova deixa a automação mais visual e preparada para migração incremental.

```text
INTELLIGENCE/
├── features/                 # histórias e cenários Gherkin/Cucumber
│   └── intelligence/
│       └── permissoes/
│           └── int-100.feature
│
├── steps/                    # definições dos passos Cucumber e vínculo com Playwright
│   └── intelligence/
│       └── int-100.steps.cjs
│
├── pom/                      # Page Objects visuais
│   └── intelligence/
│       ├── login/
│       │   ├── login.locators.ts
│       │   └── login.actions.ts
│       ├── search/
│       │   ├── search.locators.ts
│       │   └── search.actions.ts
│       ├── profile/
│       │   ├── profile.locators.ts
│       │   └── profile.actions.ts
│       ├── transaction/
│       │   ├── transaction.locators.ts
│       │   └── transaction.actions.ts
│       └── settings/
│           ├── settings.locators.ts
│           └── settings.actions.ts
│
├── utils/                    # API, banco, auth e massas
│   ├── api/
│   ├── database/
│   ├── auth/
│   └── data/
│
├── tests/                    # Playwright existente, preservado
├── support/                  # implementação técnica existente, preservada
├── cucumber.cjs
└── playwright.config.ts
```

## Responsabilidades

### Features

Contam a história do comportamento em linguagem de negócio e carregam tags como `@int-100`, `@regression`, `@smoke` e `@release-*`.

### Steps

Ligam o cenário visual do Cucumber ao cenário Playwright correspondente. Nesta primeira etapa o vínculo é validado sem duplicar a implementação funcional existente.

### POM

Cada contexto visual possui `locators` e `actions`. As actions delegam para o `IntelligencePage` existente enquanto a migração é feita gradualmente.

### Utils

Expõem API, banco, autenticação e massa em caminhos mais fáceis de localizar, reutilizando a implementação já existente em `support/`.

## Estratégia de migração

1. Preservar os testes Playwright já aprovados.
2. Criar a Feature Cucumber e validar o vínculo de cada cenário.
3. Usar POM/Utils novos em novos testes e manutenções.
4. Migrar o código antigo apenas quando houver necessidade de manutenção.
5. Antes de sincronizar com o Qase, executar novamente os testes funcionais reais pelo QA Orchestrator.
