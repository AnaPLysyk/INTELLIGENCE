# Plano de automação

`automation.plan.json` define as suítes e agendas. Os testes executáveis ficam em `steps/intelligence/{api,ui,bd}/{positivo,negativo}`; ticket e release permanecem como tags nas Features.

| Plano | Execução | Critério |
|---|---|---|
| `smoke` | a cada 6 horas úteis | cenários `@smoke` |
| `regression` | diariamente em dias úteis | cenários `@regression` |
| `release` | manual | tag da release atual ou tags dos tickets de release histórica |
| `destructive` | manual | cenários `@destructive` |

O runner é Cucumber. Playwright fornece browser/API/assertions dentro dos Steps.

## Segurança

- SMART/GBDS são usados para obter massa real sem criar dados artificiais.
- Banco SMART aceita apenas SELECT/SHOW/DESCRIBE/EXPLAIN.
- Cenários sem contrato verificável permanecem `@coverage-gap` e falham como `BLOQUEADO`; a automação não inventa método HTTP, payload ou regra de UI.
- Resultados são classificados em `test-results/qa-result.json` antes de qualquer sincronização com Qase.

## Comandos

```powershell
npm run validar
npm run test:smoke
npm run test:regression
npm run test:destructive
npm run test:release
npm run test:cucumber:int100
npm run massa:smart
```
