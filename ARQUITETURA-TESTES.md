# Arquitetura de testes

A arquitetura oficial do projeto é Cucumber-first. Os Step Definitions são a suíte executável; Playwright fornece browser, request context e assertions, mas não existe uma segunda árvore de `.spec.ts`.

```text
INTELLIGENCE/
├── features/
│   └── intelligence/
├── steps/
│   └── intelligence/
│       ├── api/
│       │   ├── positivo/
│       │   └── negativo/
│       ├── ui/
│       │   ├── positivo/
│       │   └── negativo/
│       ├── bd/
│       │   ├── positivo/
│       │   └── negativo/
│       └── common/
├── pom/
│   └── intelligence/
├── utils/
│   ├── api/
│   ├── auth/
│   ├── database/
│   ├── data/
│   ├── integrations/
│   ├── provisioning/
│   └── common/
├── config/
├── cucumber/
├── scripts/
├── cucumber.cjs
└── automation.plan.json
```

## Responsabilidades

- `features/`: comportamento e rastreabilidade por tags.
- `steps/`: teste executável e assertions, separado por API/UI/BD e positivo/negativo.
- `pom/`: implementação visual reutilizável.
- `utils/`: integrações e infraestrutura não visual.
- `cucumber/`: lifecycle de cenário, browser/request contexts, evidências e cleanup.
- `scripts/`: ferramentas operacionais e integração com o QA Orchestrator.

O validador estrutural falha se `support/`, `tests/`, `playwright.config.ts`, `.spec.ts` ou tags `@pw-*` reaparecerem.
