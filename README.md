# INTELLIGENCE — automação Cucumber + Playwright

A automação do GBS Intelligence usa Cucumber como runner e Playwright como biblioteca de browser/API/assertions. Os Step Definitions são os testes executáveis; não existe uma suíte paralela em `tests/`.

## Estrutura

```text
features/intelligence/api/            contratos HTTP organizados pelo domínio da API
features/intelligence/ui/             comportamentos visuais organizados pela estrutura da aplicação
features/intelligence/bd/             persistência/fonte de dados organizada por banco e tabela
steps/intelligence/api/positivo/      testes executáveis positivos de API
steps/intelligence/api/negativo/      testes executáveis negativos de API
steps/intelligence/ui/positivo/       testes executáveis positivos de UI
steps/intelligence/ui/negativo/       testes executáveis negativos de UI
steps/intelligence/bd/positivo/       testes executáveis positivos de banco
steps/intelligence/bd/negativo/       testes executáveis negativos de banco
pom/intelligence/                     Page Objects, locators e ações de UI
utils/                                API, banco, auth, dados, integrações e provisionamento
config/                               configuração de ambiente
cucumber/                             World e Hooks
scripts/                              validação, execução por ticket e relatórios
```

Exemplo de Feature por camada/domínio:

```text
features/intelligence/
├── api/
│   ├── autenticacao/sessao.feature
│   ├── busca/perfis.feature
│   ├── campos/catalogo.feature
│   ├── perfis/{consulta,escrita}.feature
│   └── transacoes/consulta.feature
├── ui/
│   ├── autenticacao/acesso.feature
│   ├── busca/pesquisa.feature
│   ├── configuracoes/preferencias.feature
│   ├── navegacao/view-only.feature
│   ├── perfis/{consulta,edicao}.feature
│   └── transacoes/{detalhes,edicao,exportacao}.feature
└── bd/
    └── smart/
        ├── conexao.feature
        └── tabelas/process.feature
```

Fluxo principal:

```text
FEATURE -> STEP -> POM   (UI)
                -> UTILS (API/BD/AUTH/DATA)
```

## Tags

Diretórios representam a aplicação. Critérios de execução ficam nas tags:

```gherkin
@regression @smoke @release-5.5.0.5062
@int-100 @viewonly @permission-intelligence_view_only
```

- `@regression`, `@smoke`, `@destructive`: suíte/estratégia.
- `@release-*`, `@release-unassigned`, `@introduced-in-*`: rastreabilidade de release.
- `@int-*`: ticket.
- `@admin`, `@viewonly`, `@no-access`: perfil usado.
- `@permission-*`: permissão técnica comprovada.
- `@table-*`: tabela envolvida quando a Feature é de BD.

Não criar diretórios por regressão, smoke, release, ticket ou grupo de permissão.

## Execução

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

## Regras

- Features: camada + domínio real da aplicação.
- Steps: testes executáveis separados por camada e positivo/negativo.
- UI reutilizável: POM.
- API/BD/auth/data: Utils.
- Ausência de conta, permissão, massa ou contrato verificável falha explicitamente como `BLOQUEADO`.
- Nenhum teste deve aceitar HTTP 500 apenas para ficar verde.
- Banco SMART é somente leitura; comandos de escrita são bloqueados antes de alcançar o banco.
- Qase só recebe resultado depois da execução funcional real.
