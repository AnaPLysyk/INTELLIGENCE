# INTELLIGENCE — automação Cucumber + Playwright

A automação do GBS Intelligence usa Cucumber como runner e Playwright como biblioteca de browser/API/assertions. Não existe uma suíte paralela em `tests/`: os Step Definitions são os testes executáveis.

## Estrutura

```text
features/intelligence/                 histórias e cenários Gherkin
steps/intelligence/api/positivo/       testes executáveis positivos de API
steps/intelligence/api/negativo/       testes executáveis negativos de API
steps/intelligence/ui/positivo/        testes executáveis positivos de UI
steps/intelligence/ui/negativo/        testes executáveis negativos de UI
steps/intelligence/bd/positivo/        testes executáveis positivos de banco
steps/intelligence/bd/negativo/        testes executáveis negativos de banco
pom/intelligence/                      Page Objects, locators e ações de UI
utils/api/                             clientes e contratos HTTP do Intelligence
utils/database/                        acesso somente leitura ao banco
utils/auth/                            resolução de perfis/credenciais
utils/data/                            contrato e leitura de massa
utils/integrations/                    clientes SMART/GBDS usados na massa
utils/provisioning/                    descoberta/geração segura de massa
config/                                configuração de ambiente
cucumber/                              World e Hooks
scripts/                               validação, execução por ticket e relatórios
```

Fluxo principal:

```text
FEATURE -> STEP -> POM   (UI)
                -> UTILS (API/BD/AUTH/DATA)
```

`support/`, `tests/`, `.spec.ts` e o bridge Cucumber→Playwright Test são considerados resíduos legados e o validador estrutural impede que reapareçam.

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

- Features descrevem comportamento; release/ticket são tags, nunca diretórios.
- Steps são os testes executáveis e ficam separados por camada e positivo/negativo.
- UI reutilizável fica em POM; API/BD/auth/data ficam em Utils.
- Ausência de conta, permissão, massa ou contrato verificável falha explicitamente como `BLOQUEADO`.
- Nenhum teste deve aceitar HTTP 500 apenas para ficar verde.
- Banco SMART é somente leitura; INSERT/UPDATE/DELETE e SQL empilhado são bloqueados antes da conexão executar o comando.
- Qase só recebe resultado depois da execução funcional real.
