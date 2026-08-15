# INTELLIGENCE — automação Playwright

Automação independente da UI do Intelligence. Os cenários atuais cobrem o ticket `INT-100`,
com testes de UI e dos contratos HTTP do mecanismo de busca.

## Plano de testes

O [plano desta fase](PLANO_DE_TESTES.md) cobre a única Tela de Busca e separa claramente os
cenários positivos e negativos de UI e API, a conferência no banco e o gerador de massa para cada
tipo disponível no seletor.

O [relatório de cobertura e execução](RELATORIO_COBERTURA_E_EXECUCAO.md) confronta o plano com a
documentação interna e os tickets Jira do Intelligence, registrando também o resultado da última
execução Playwright.

## Preparação

1. Instale as dependências com `npm install`.
2. Instale o Chromium com `npx playwright install chromium` quando necessário.
3. Crie `.env.local` a partir de `.env.example` e preencha os valores do ambiente.

## Gerar massa a partir do SMART

`tests/` contém somente testes da aplicação, separados em `tests/ui` e `tests/api`. Geradores de
massa, clientes, acesso ao banco e demais recursos auxiliares ficam exclusivamente em `support/`.
O gerador atual está em `support/functions/massa`.

Preencha também `SMART_API_BASE_URL`, as credenciais de operador e a conexão somente leitura do
banco SMART. Em seguida execute:

```powershell
npm run massa:smart
```

O gerador seleciona processos que já possuem `TGUID` e `PGUID` na tabela `Process`, consulta os
biográficos pela API oficial `GET /api/processos/{id}` e grava
`test-data/generated/intelligence.busca.massa.json`. Ele tenta cobrir PGUID, TGUID, ID externo,
CPF, data de nascimento, nome e CIB; se algum tipo não existir nos candidatos, informa exatamente
qual ficou bloqueado. Os testes atuais usam automaticamente os TGUID/PGUID gerados, mantendo as
variáveis `INT_100_TGUID` e `INT_100_PGUID` como precedência manual.

O cliente de banco bloqueia por código qualquer SQL diferente de
`SELECT/SHOW/DESCRIBE/EXPLAIN`, rejeita comandos empilhados e não cria ou altera massa.

O `.env.local` não é versionado. Ausência de URL, credencial, massa ou liberação do front produz
falha explícita de configuração; os testes não usam `skip` para esconder pré-condições ausentes.

## Validação e execução

```powershell
npm run typecheck
npm run validar
npm run test:list
npm run test:intelligence
npm run test:ui
npm run test:api
```

As evidências são gravadas em `test-results/` e `playwright-report/`, incluindo JSON, traces,
screenshots e vídeos conforme a disponibilidade e o resultado.

## Fronteira com o SMART

Este projeto trouxe do SMART somente o necessário para obter massa: autenticação, consulta da API
e oráculo de banco em leitura. A criação/captura de um processo novo continua no fluxo responsável
do SMART, porque um processo recém-criado nasce aguardando captura e ainda não possui TGUID/PGUID.
Não há escrita direta no SMART ou no GBDS.
