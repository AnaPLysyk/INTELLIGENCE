# INTELLIGENCE — automação Cucumber + Playwright

A automação do GBS Intelligence usa Cucumber como runner e Playwright como biblioteca de browser/API/assertions. Os Step Definitions são os testes executáveis; não existe uma suíte paralela em `tests/`.

## Estrutura

As Features representam o comportamento por camada/domínio. Os Steps representam a responsabilidade técnica real dentro de cada camada.

```text
steps/intelligence/
├── api/
│   ├── autenticar/
│   ├── buscar/
│   ├── consultar/
│   └── escrever/
├── ui/
│   ├── autenticacao/
│   ├── busca/
│   ├── configuracoes/
│   ├── navegacao/
│   ├── perfis/
│   └── transacoes/
├── bd/
│   └── smart/
│       ├── conexao.steps.ts
│       └── tabelas/process.steps.ts
└── common/
    └── case.steps.ts
```

Regra de leitura:

- API: **operação → recurso** (`buscar/perfis`, `consultar/transacoes`, `escrever/perfis`).
- UI: **tela/área → comportamento** (`perfis/consulta`, `transacoes/edicao`).
- BD: **banco → tabela** (`smart/tabelas/process`).
- `@positive`, `@negative`, `@regression`, `@smoke`, release, ticket e permissão são tags; não são diretórios.

## POM e Utils

O POM é a camada visual reutilizável. Cada área deve manter `*.actions.ts` para ações/asserções de UI e `*.locators.ts` para elementos da tela.

`utils/` contém implementação não visual: clientes e contratos de API, autenticação, banco, massa e integrações. Os testes em `steps/` chamam POM ou Utils; não duplicam essas funções.

Fluxo principal:

```text
FEATURE -> STEP -> POM   (UI)
                -> UTILS (API/BD/AUTH/DATA)
```

## Como executar

Por Feature:

```powershell
npm run test:feature -- features/intelligence/ui/perfis/consulta.feature
```

Por arquivo de Steps:

```powershell
npm run test:steps -- steps/intelligence/api/consultar/perfis.steps.ts
```

Por caso:

```powershell
npm run test:case -- API-POS-PROFILE-VIEWONLY-01
```

Por tag/ticket/suite:

```powershell
npm run test:tag -- @int-100
npm run test:tag -- @smoke
```

Para somente validar o mapeamento, adicione `--dry-run`. Para UI visível, adicione `--headed`.

```powershell
npm run test:feature -- features/intelligence/ui/perfis/consulta.feature --dry-run
npm run test:steps -- steps/intelligence/ui/perfis/consulta.steps.ts --headed
```

## Tags

```gherkin
@regression @smoke @release-5.5.0.5062
@int-100 @viewonly @permission-intelligence_view_only
```

- `@regression`, `@smoke`, `@destructive`: suíte/estratégia.
- `@release-*`, `@release-unassigned`, `@introduced-in-*`: rastreabilidade de release.
- `@int-*`: ticket.
- `@admin`, `@viewonly`, `@no-access`: perfil usado.
- `@permission-*`: permissão técnica comprovada.
- `@positive`, `@negative`: natureza do cenário.

## Execução completa

```powershell
npm install
npx playwright install chromium
npm run typecheck
npm run validar:estrutura
npm run test:smoke
npm run test:regression
npm run test:destructive
npm run test:release
npm run massa:smart
```

Para INT-100:

```powershell
npm run test:cucumber:int100:dry
npm run test:cucumber:int100
```

`build:cucumber` sempre remove `.cucumber-dist` antes de compilar. Isso evita que Steps movidos ou apagados permaneçam como JavaScript antigo e sejam carregados em duplicidade pelo Cucumber.

## Regras

- Features: camada + domínio real da aplicação.
- Steps API: operação + recurso.
- Steps UI: tela/área da aplicação.
- Steps BD: banco + tabela.
- UI reutilizável: POM.
- API/BD/auth/data: Utils.
- Ausência de conta, permissão, massa ou contrato verificável falha explicitamente como `BLOQUEADO`.
- Nenhum teste deve aceitar HTTP 500 apenas para ficar verde.
- Banco SMART é somente leitura; comandos de escrita são bloqueados antes de alcançar o banco.
- Qase só recebe resultado depois da execução funcional real.
