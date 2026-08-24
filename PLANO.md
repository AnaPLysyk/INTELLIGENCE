# Plano de automação

`automation.plan.json` define suítes e agendas. As Features ficam organizadas por camada e domínio em `features/intelligence/{api,ui,bd}`; os testes executáveis ficam em `steps/intelligence/{api,ui,bd}/{positivo,negativo}`.

Ticket, release, suite e permissões são tags, nunca diretórios.

| Plano | Execução | Critério |
|---|---|---|
| `smoke` | a cada 6 horas úteis | cenários `@smoke` |
| `regression` | diariamente em dias úteis | cenários `@regression` |
| `release` | manual | tag da release atual ou tags dos tickets de release histórica |
| `destructive` | manual | cenários `@destructive` |

Exemplo de rastreabilidade:

```gherkin
@regression @int-100 @release-unassigned
@viewonly @permission-intelligence_view_only
```

O runner é Cucumber. Playwright fornece browser/API/assertions dentro dos Steps.

## Segurança

- SMART/GBDS são usados para obter massa real sem criar dados artificiais.
- Banco SMART aceita apenas SELECT/SHOW/DESCRIBE/EXPLAIN.
- Cenários sem contrato verificável permanecem `@coverage-gap` e falham como `BLOQUEADO`.
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
