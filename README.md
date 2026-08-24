# INTELLIGENCE — automação Cucumber + Playwright

A automação usa Cucumber como runner e Playwright como biblioteca de browser/API/assertions. Os Step Definitions são os testes executáveis; não existe suíte paralela em `tests/`.

## Estrutura

- `features/intelligence/{api,ui,bd}`: comportamento e rastreabilidade.
- `steps/intelligence/api`: operação → recurso.
- `steps/intelligence/ui`: tela/área → comportamento.
- `steps/intelligence/bd`: banco → tabela.
- `pom/intelligence`: `*.actions.ts` e `*.locators.ts` da UI.
- `utils/`: API, auth, banco, massa, integrações e funções não visuais.

## Tags de execução

Cada cenário pode participar de mais de uma campanha sem ser duplicado fisicamente:

```gherkin
@case-INT-100-I2
@int-100
@acceptance
@regression
@viewonly
@permission-intelligence_view_only
```

- `@case-*`: ID estável da automação e seletor de `qa run --case-id`.
- `@int-*`: ticket Jira.
- `@acceptance`: validação de aceitação por ticket.
- `@regression`: regressão geral.
- `@smoke`: smoke.
- `@release-*`: release.
- `@qase-*`: reservado para o ID real do caso no Qase depois da criação/importação; nunca inventar esse valor.

## Execução pelo QA Orchestrator

A sintaxe oficial do CLI é `qa run --project <id> <capability> [flags]`.

```powershell
# Aceitação completa do INT-100
qa run --project intelligence acceptance --ticket INT-100

# Apenas os casos regressivos do INT-100
qa run --project intelligence regression --ticket INT-100

# Um caso específico da regressão
qa run --project intelligence regression --case-id API-POS-PROFILE-VIEWONLY-01

# Regressão completa
qa run --project intelligence regression

# Smoke completo
qa run --project intelligence smoke
```

Para Qase, `--qase` significa uma execução dedicada e `--qase-run-id <ID>` aponta para uma Test Run existente. Esse ID é da **run**, não do caso. O ID do caso Qase será mantido em `@qase-<ID>` quando os casos forem criados.

## Execução direta no projeto

```powershell
npm run test:feature -- features/intelligence/ui/perfis/consulta.feature
npm run test:steps -- steps/intelligence/api/consultar/perfis.steps.ts
npm run test:case -- API-POS-PROFILE-VIEWONLY-01
npm run test:tag -- @int-100
```

Use `--dry-run` para validar seleção/mapeamento e `--headed` para UI visível.

## Fluxo

```text
FEATURE -> STEP -> POM   (UI)
                -> UTILS (API/BD/AUTH/DATA)
```

Qase só recebe resultado depois da execução funcional real. HTTP 500 não é aceito apenas para deixar o teste verde. Banco SMART permanece somente leitura.
