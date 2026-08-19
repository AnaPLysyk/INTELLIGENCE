# INTELLIGENCE — automação Playwright

Automação de smoke, regressão e release do GBS Intelligence. O projeto usa SMART, banco e GBDS
somente para descobrir massa real; nenhuma dessas fontes é alterada.

## Estrutura

```text
tests/api/intelligence/ cenários positivos e negativos de API
tests/ui/intelligence/  cenários positivos, negativos e cobertura histórica de UI
tests/bd/intelligence/  integridade da fonte e bloqueio de comandos destrutivos
support/functions/api/  clientes HTTP e fluxos de autorização
support/functions/ui/   Page Objects com ações e validações visuais
support/functions/bd/   consultas somente leitura
support/functions/provisionamento/ fluxos de preparação da massa
support/massas/dados/   contrato e leitura da massa gerada
automation.plan.json    suites, tags, releases históricas e agendas
orchestrator.cjs        executor único do plano
PLANO.md                leitura humana do mapeamento
playwright.config.ts    configuração Playwright
```

Arquivos gerados ficam em `test-data/generated/`, `test-results/` e `playwright-report/`; todos são
ignorados quando contêm dados ou evidências locais.

## Preparação

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env.local
```

O `.env.local` é a fonte padrão e não é versionado. Neste ambiente ele já contém as configurações
necessárias de Intelligence, SMART, banco e GBDS. Em CI, use o secret `INTELLIGENCE_ENV_FILE`.

## Execução

```powershell
npm run validar
npm run test:smoke
npm run test:regression
npm run test:destructive
npm run test:release
npm run massa:smart
```

- `smoke`: 6 verificações críticas e estáveis.
- `regression`: 48 cenários funcionais mantidos no projeto.
- `destructive`: 9 testes seguros de robustez; não altera dados reais.
- `release`: todos os cenários da release atual ou de uma release histórica selecionada.
- `massa:smart`: diagnóstico isolado da geração de massa.

### Rastreabilidade por ticket e release

O teste continua armazenado por domínio/camada; não existe pasta ou cópia de teste por release.
Ticket, origem e estratégia de execução são metadados do mesmo caso:

```text
@int-31 @introduced-in-1.8.1 @regression @ui @editing
```

Para um ticket, o QA Orchestrator continua enviando `QA_TICKET_KEY=INT-31` e o executor seleciona
`@int-31`.

Para uma release histórica, execute a suíte `release` e informe `QA_RELEASE_VERSION`:

```powershell
$env:QA_RELEASE_VERSION = '1.8.1'
npm run test:release
```

ou, sem persistir a variável no terminal:

```powershell
node orchestrator.cjs release --release-version=1.8.1
```

Mapeamento atual:

```text
1.8.1      INT-31, INT-33
1.8.2      INT-40
2.0.0      INT-24, INT-30
unassigned INT-32
```

A seleção de uma release histórica é resolvida para as tags dos tickets. Assim o mesmo caso atende
ticket, release e regressão sem duplicidade.

O [plano](automation.plan.json) é consumido pelo orquestrador local e pelo workflow agendado. Veja
[PLANO.md](PLANO.md) para agenda, tags e critérios de seleção.

## Regras de manutenção

- Novo cenário entra no par positivo/negativo ou arquivo funcional da camada correspondente e recebe tags de plano.
- Não criar uma pasta por ticket, release ou seletor; pasta representa camada ou produto.
- Release de origem usa `@introduced-in-X.Y.Z`; `@release-X.Y.Z` continua reservado para a build/release alvo em validação.
- Um comportamento compartilhado por vários tickets permanece um único teste com múltiplas tags de ticket quando necessário.
- Requisito incompleto não vira comportamento inventado: fica como cobertura bloqueada até existir critério verificável.
- Page Object termina em `.page.ts`, cliente em `.client.ts`, banco em `.repository.ts` e fluxo em `.flow.ts`.
- `npm run validar:estrutura` impede arquivos fora desse contrato.
- Ausência de conta, permissão ou massa falha explicitamente como `BLOQUEADO`; não usar `skip`.
- SQL do gerador aceita somente `SELECT`, `SHOW`, `DESCRIBE` e `EXPLAIN`.
- Segredos permanecem exclusivamente no `.env.local` ou no cofre do executor.
