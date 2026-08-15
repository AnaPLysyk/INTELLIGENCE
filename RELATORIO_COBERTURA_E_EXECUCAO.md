# Relatório de Cobertura e Execução — GBS Intelligence

Data: 14/08/2026

## Resultado executivo

- O Jira do projeto `INT` possui 98 itens retornados na consulta atual, incluindo 27 bugs.
- O plano atual cobre o **módulo de busca**, mas não a aplicação inteira.
- A documentação histórica confirma busca por `PGUID`, `TGUID`, chaves, External ID, campos configurados e valores inexistentes.
- Foram adicionadas coberturas específicas para `relatedExternalIds`, colisão de External ID configurado, pessoa excluída e configurações de listagem/busca.
- A suíte disponível contém 6 testes do `INT-100`; ela ainda não implementa as matrizes completas de busca descritas no plano.
- A execução dos 6 testes foi bloqueada por ausência de configuração e massa. Nenhum defeito do produto foi confirmado nessa execução.

## Fontes internas consultadas

### Confluence

- [Testes Release Intelligence 1.8.0/1.8.1](https://griaule.atlassian.net/wiki/spaces/dev/pages/283770893/Testes+Release+Intelligence+1.8.0+1.8.1)
- [Testes Release Intelligence 1.9.0](https://griaule.atlassian.net/wiki/spaces/dev/pages/626360333/Testes+Release+Intelligence+1.9.0)
- [Testes Release Intelligence 2.1.0](https://griaule.atlassian.net/wiki/spaces/dev/pages/813269016/Testes+Release+Intelligence+2.1.0)
- [Configurações Intelligence](https://griaule.atlassian.net/wiki/spaces/dev/pages/609878024/Configura+es+Intelligence)
- [Documentação técnica do produto](https://griaule.atlassian.net/wiki/spaces/dev/pages/469303365/Documenta+o+t+cnica+do+produto+-+Intelligence)
- [Visão geral de suporte](https://griaule.atlassian.net/wiki/spaces/Support/pages/1472266251/Intelligence)

### Jira relevante para busca

| Ticket | Situação consultada | Impacto no plano |
|---|---|---|
| [INT-17](https://griaule.atlassian.net/browse/INT-17) | Ready for Development | Exige TGUID, PGUID, chave e External ID com GBDS Client v5 |
| [INT-33](https://griaule.atlassian.net/browse/INT-33) | QA Requested | Plano de release inclui fumaça e regressão da busca |
| [INT-95](https://griaule.atlassian.net/browse/INT-95) | Concluído em 2.2.0 | External ID pode existir em `relatedExternalIds` |
| [INT-97](https://griaule.atlassian.net/browse/INT-97) | Pending Release | Busca por RAE deve resolver a transação aceita após tratamento no Trust |
| [INT-98](https://griaule.atlassian.net/browse/INT-98) | Backlog | ID externo configurado pode duplicar o seletor e quebrar a busca |
| [INT-100](https://griaule.atlassian.net/browse/INT-100) | Em andamento | View-only deve ser bloqueado em `/profile/list/count` e `/profile/list` |

## Cobertura do módulo de busca

| Comportamento | Planejado | Automatizado hoje |
|---|---|---|
| Catálogo real do seletor | Sim | Helper parcial para ler opções |
| PGUID positivo/negativo/excluído | Sim | Não |
| TGUID positivo/negativo | Sim | Apenas baseline dependente de deep link |
| Chaves configuradas | Sim | Não |
| CPF | Sim | Não |
| External ID nativo | Sim | Não |
| External ID em `relatedExternalIds` | Sim | Não |
| Colisão External ID nativo × `sphinx.fields` | Sim | Não |
| Nome/data/CIB | Sim | Não |
| Campos biográficos e labels dinâmicos | Sim | Não |
| Valor inexistente, vazio, inválido e payload hostil | Sim | Não |
| `count` × `list` × UI × banco | Sim | Não |
| Paginação | Sim | Não |
| `alwaysSearchExternalIDS` | Sim | Não |
| `listFields` e `showField.tguid` | Sim | Não |
| Usuário view-only sem busca | Sim | Parcial: 1 teste UI |

## Áreas da aplicação que permanecem fora desta fase

- detalhes de perfil e transação;
- histórico e links entre transações;
- biometrias, conversão WSQ e estados de carregamento;
- exportação/importação NIST;
- edição de biográficos;
- exclusão e atualização de chaves/perfis;
- HITs do BEST;
- traduções, temas e formatos;
- autenticação avançada e administração de permissões.

Portanto, a resposta para “cobrimos a aplicação?” é: **não integralmente**. Cobrimos o planejamento da busca, que é o escopo definido para esta fase.

## Execução realizada

Comando:

```powershell
npm run test:intelligence
```

Resultado Playwright:

| Total | Aprovados | Falhas técnicas | Bloqueados por configuração |
|---:|---:|---:|---:|
| 6 | 0 | 0 | 6 |

### Motivos dos bloqueios

- `INTELLIGENCE_UI_URL` ausente;
- credenciais de acesso completo ausentes;
- usuário view-only ausente;
- usuário sem permissão ausente;
- `INT_100_FRONT_EM_QA` não confirmado como `true`;
- `INT_100_TGUID` e `INT_100_PGUID` ausentes;
- templates reais das URLs de transação e perfil ausentes.

O Playwright registrou os casos como `failed` porque os testes foram construídos para falhar explicitamente quando as pré-condições não existem. Na classificação de QA, o resultado é **BLOQUEADO**, não defeito da aplicação.

### Gerador SMART — execução de 2026-08-14

Foi implementado e executado o comando `npm run massa:smart`. A estrutura do teste iniciou
corretamente, porém a geração foi classificada como **BLOQUEADA** antes de qualquer chamada ao
produto porque `SMART_DB_HOST` não está configurado neste repositório. Nenhuma consulta ao banco,
autenticação SMART ou escrita de arquivo de massa ocorreu nessa tentativa.

Também foi executado `npm run typecheck` após a adaptação: **aprovado**.

## Próximo passo técnico

1. Configurar `.env.local` com a API/banco SMART e executar `npm run massa:smart`.
2. Configurar URL e usuários do Intelligence.
3. Implementar os testes API positivos e negativos parametrizados com o JSON gerado.
4. Implementar os testes da única Tela de Busca usando a mesma massa.
5. Executar a comparação `Banco = API = UI`.
