# INTELLIGENCE — automação Playwright

Automação de smoke, regressão e release do GBS Intelligence. O projeto usa SMART, banco e GBDS
somente para descobrir massa real; nenhuma dessas fontes é alterada.

## Estrutura

```text
tests/api/intelligence/ cenários positivos e negativos de API
tests/ui/intelligence/  cenários positivos e negativos de UI
tests/bd/intelligence/  integridade da fonte e bloqueio de comandos destrutivos
support/functions/api/  clientes HTTP e fluxos de autorização
support/functions/ui/   Page Objects com ações e validações visuais
support/functions/bd/   consultas somente leitura
support/functions/provisionamento/ fluxos de preparação da massa
support/massas/dados/   contrato e leitura da massa gerada
automation.plan.json    suites, tags e agendas
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
- `regression`: os 42 cenários mantidos no projeto.
- `destructive`: 9 testes seguros de robustez; não altera dados reais.
- `release`: todos os cenários da release mapeada.
- `massa:smart`: diagnóstico isolado da geração de massa.

O [plano](automation.plan.json) é consumido pelo orquestrador local e pelo workflow agendado. Veja
[PLANO.md](PLANO.md) para agenda, tags e critérios de seleção.

## Regras de manutenção

- Novo cenário entra no par positivo/negativo da camada correspondente e recebe tags de plano.
- Não criar uma pasta por ticket, release ou seletor; pasta representa camada ou produto.
- Page Object termina em `.page.ts`, cliente em `.client.ts`, banco em `.repository.ts` e fluxo em `.flow.ts`.
- `npm run validar:estrutura` impede arquivos fora desse contrato.
- Ausência de conta, permissão ou massa falha explicitamente como `BLOQUEADO`; não usar `skip`.
- SQL do gerador aceita somente `SELECT`, `SHOW`, `DESCRIBE` e `EXPLAIN`.
- Segredos permanecem exclusivamente no `.env.local` ou no cofre do executor.
