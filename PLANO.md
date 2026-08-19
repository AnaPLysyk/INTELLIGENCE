# Plano de automação

O arquivo `automation.plan.json` é a fonte única para decidir o que executar. Como no SMART, os
testes ficam separados por camada (`tests/api`, `tests/ui`, `tests/bd`) e pelo par
`positivo`/`negativo`; ticket e release permanecem como metadados, nunca como diretórios.

| Plano | Quando | Escopo |
|---|---|---|
| `smoke` | A cada 6 horas úteis | 6 verificações críticas: autenticação, banco, CPF, busca e deep-link administrativos |
| `regression` | Diariamente em dias úteis | Todos os 42 cenários do repositório |
| `release` | Manualmente antes da aprovação | Todos os testes marcados com a release `5.5.0.5062` |
| `destructive` | Manualmente ou antes da release | 9 cenários seguros de entrada hostil e proteção contra escrita |

As agendas usam UTC. O workflow roda em Windows self-hosted porque o ambiente atual está em rede
privada. Para CI, configure o secret `INTELLIGENCE_ENV_FILE` com o conteúdo integral do `.env.local`
ou mantenha esse arquivo no runner.

## Mapeamento atual

- `@smoke`: fluxos estáveis e críticos que não dependem de perfis LDAP restritos.
- `@regression`: todos os cenários automatizados mantidos neste projeto.
- `@release-5.5.0.5062`: escopo da release atual.
- `@api`, `@ui` e `@bd`: permitem análise por camada sem criar novas árvores de pastas.
- `@positive`, `@negative`, `@security`, `@viewonly` e `@admin`: refinamentos opcionais.
- `@destructive`: entradas malformadas/hostis e comandos de escrita que devem ser bloqueados antes de alterar dados.

A regressão possui 16 casos positivos e 26 negativos. Nove dos negativos são destrutivos seguros:
SQL injection, XSS, path traversal, entrada excessiva e tentativa de `INSERT`, `UPDATE`, `DELETE` ou
SQL empilhado. Nenhum deles executa escrita no ambiente; a proteção do repositório de banco é o
próprio objeto do teste.

Os cenários que exigem `view-only` ou `sem-permissao` permanecem na regressão/release e falham como
`BLOQUEADO` enquanto os grupos correspondentes não existirem no LDAP. Dados de nome, nascimento,
ID externo e CIB também são bloqueados individualmente se não estiverem pesquisáveis no índice.

## Rastreabilidade de documentação e bugs

| Fonte | Comportamento coberto | Casos automatizados |
|---|---|---|
| Manual oficial e guia de integração | autenticação, catálogo, busca sem resultado, paginação e validação dos identificadores | `API-NEG-COMMON-04/05`, `API-NEG-LOGIN-01/02`, `API-POS-FIELDS-01`, `API-NEG-FIELDS-AUTH-01/02`, `API-NEG-NOTFOUND-01`, `API-POS/NEG-PAGINATION-01`, `API-NEG-TGUID-01` |
| Plano de release Intelligence 1.8.0/1.8.1 | busca por PGUID/TGUID, chave, External ID, campo configurado e valores inexistentes | `API-POS-TGUID-01`, `INT-17-PGUID-UI`, `INT-100-BASELINE`, `API-POS-CPF/EXTERNAL/BIRTHDATE/NAME/CIB-01`, `API-NEG-NOTFOUND-01` |
| `INT-17` | visualização de PGUID/TGUID e regressão após atualização do GBDS Client | `API-POS-TGUID-01`, `INT-17-PGUID-UI`, `INT-100-BASELINE`, `BD-POS-MASSA-01`, `API-NEG-TRANSACTION-AUTH-01` |
| `INT-23` | `/fields/list` fornece os campos configurados exibidos pela interface | `API-POS-FIELDS-01`, `UI-POS-FIELDS-01`, `API-NEG-FIELDS-AUTH-01/02` |
| `INT-95` e `INT-97` | External ID e `relatedExternalIds` continuam pesquisáveis após tratamento | `API-POS-EXTERNAL-01` — exige massa produzida pelo fluxo Trust |
| `INT-98` | configuração de chave externa não duplica nem torna ambígua a opção visual | `UI-POS-FIELDS-01`, `API-POS-EXTERNAL-01` |
| `INT-100` | acesso completo, somente leitura e negação de acesso por URL | `INT-100-I1`, `INT-100-I2`, `INT-100-I3`, `INT-100-I4`, `INT-100-I5`, `INT-100-I6`, `INT-100-I7`, `INT-100-R3`, `INT-100-BASELINE`, `API-NEG-COMMON-06`, `API-POS-PROFILE-VIEWONLY-01`, `API-NEG-PROFILE-NOTFOUND-01`, `INT-100-WRITE-ENDPOINTS-01` (bloqueado — contrato dos endpoints de escrita nao documentado) |
| Análise de risco da busca | payload obrigatório, entrada vazia e vetores hostis não podem expor perfis ou derrubar a API | `API-NEG-PAYLOAD-*-01`, `API-DES-*-01`, `UI-NEG-EMPTY-01`, `UI-DES-XSS-01` |
| Regra de fonte somente leitura | SMART/BD fornece massa, mas a automação nunca pode escrever | `BD-POS-CONNECTION-01`, `BD-POS-MASSA-01`, `BD-DES-*-01` |

Os links das fontes ficam neste plano, evitando criar uma árvore documental paralela:

- [Manual oficial do Intelligence](https://docs.griaule.com/aplicacoes/intelligenceweb)
- [Guia oficial de integração](https://docs.griaule.com/gbs/en/integration/intelligenceintegration)
- [Plano de release 1.8.0/1.8.1](https://griaule.atlassian.net/wiki/spaces/dev/pages/283770893/Testes+Release+Intelligence+1.8.0+1.8.1)
- [INT-17](https://griaule.atlassian.net/browse/INT-17), [INT-23](https://griaule.atlassian.net/browse/INT-23), [INT-95](https://griaule.atlassian.net/browse/INT-95), [INT-97](https://griaule.atlassian.net/browse/INT-97), [INT-98](https://griaule.atlassian.net/browse/INT-98) e [INT-100](https://griaule.atlassian.net/browse/INT-100)

## Comandos

```powershell
npm run plan:show
npm run test:smoke
npm run test:regression
npm run test:destructive
npm run test:release
npm run test:scheduled
```

Para um filtro pontual, use a tag diretamente: `npx playwright test --grep "@api"`.
