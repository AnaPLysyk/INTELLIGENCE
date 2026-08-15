# Plano de Testes — Busca do GBS Intelligence

## 1. Escopo desta fase

Nesta fase será testada **uma única tela: Tela de Busca**.

O que muda nessa tela:

1. a opção escolhida no seletor **Chave**;
2. o conteúdo digitado na barra/campo **Valor**;
3. a chamada feita pela aplicação;
4. a lista e a quantidade de resultados apresentados.

### Incluído agora

- UI da Tela de Busca;
- API acionada por cada tipo de busca;
- conferência dos resultados no banco de dados;
- cenários positivos e negativos separados;
- gerador de massa para cada tipo de busca;
- comparação `Banco → API → UI`.

### Fora desta fase

- detalhe de perfil;
- detalhe de transação;
- deep link e modo somente leitura do `INT-100`;
- 2FA, recuperação de senha e troca de navegador;
- configurações de tema, idioma, data e hora;
- atalhos para outras aplicações;
- alteração de dados no Intelligence ou no GBDS.

O login será usado somente como pré-condição para chegar à Tela de Busca.

---

## 2. Separação do projeto

```text
tests/
├── ui/
│   └── busca/
│       ├── busca.positivo.ui.spec.ts
│       └── busca.negativo.ui.spec.ts
└── api/
    └── busca/
        ├── busca.positivo.api.spec.ts
        └── busca.negativo.api.spec.ts

support/
├── pages/
│   └── intelligence.busca.page.ts
├── api/
│   └── intelligence.busca.api.ts
├── db/
│   ├── conexao.db.ts
│   └── intelligence.busca.repository.ts
├── data/
│   ├── tipos-busca.ts
│   ├── massa-busca.ts
│   └── massa-busca.schema.ts
├── assertions/
│   └── intelligence.busca.assertions.ts
└── functions/
    └── massa/
        └── gerar-massa-busca.smart.spec.ts

test-data/
└── generated/
    └── intelligence.busca.massa.json
```

### Regra de organização

- **UI:** somente interação e validação visível da Tela de Busca.
- **API:** somente contrato HTTP e conteúdo retornado.
- **BD:** somente leitura e comparação da fonte de verdade, sempre implementado em `support/`.
- **Gerador:** prepara entradas e resultados esperados para UI e API e fica em `support/`.
- **Tests:** `tests/` aceita exclusivamente testes de `ui` e `api` da aplicação.
- **Positivo e negativo:** ficam em arquivos diferentes e com IDs diferentes.

Não criar um arquivo de teste por seletor. Os seletores devem alimentar testes parametrizados, evitando duplicação.

---

## 3. Tipos de busca conhecidos

O teste deve ler as opções reais do `<select>` no ambiente. A lista abaixo é o catálogo inicial observado no projeto.

| Código | Texto esperado no seletor | `value` observado | Categoria | Resultado principal esperado |
|---|---|---|---|---|
| TGUID | TGUID | `TGUID` | Identificador de transação | Transação correspondente |
| PGUID | PGUID | `PGUID` | Identificador de perfil | Perfil correspondente |
| CPF | CPF/cpf | `cpf` | Chave | Perfil correspondente |
| EXTERNAL_ID | Id externo | `EXTERNAL.ID` | Identificador externo | Perfil correspondente |
| BIRTHDATE | Data de Nascimento | `birthdate` | Biográfico | Zero, um ou vários perfis |
| NAME | Nome | `name` | Biográfico | Zero, um ou vários perfis |
| CIB | cib_exid/CIB | `cib` | Chave/identificador configurado | Perfil correspondente |
| DYNAMIC | Campo configurado no ambiente | Lido da tela | Chave, biográfico ou label | Resultado conforme configuração |

### Regra para tipos dinâmicos

Se o ambiente apresentar uma opção que não está no catálogo:

1. o teste de catálogo deve sinalizar a nova opção;
2. o gerador deve consultar o mapeamento desse campo;
3. o tipo só entra na regressão depois de ter origem no banco, formato e resultado esperado definidos;
4. não se deve ignorar silenciosamente uma nova opção.

---

## 4. Fluxo único da Tela de Busca

### Pré-condição

Usuário com acesso completo autenticado e Tela de Busca carregada.

### Passos base

1. selecionar uma opção em **Chave**;
2. preencher **Valor**;
3. clicar em **Pesquisar/Buscar**;
4. aguardar a chamada de rede correspondente;
5. validar mensagem, quantidade e itens exibidos;
6. comparar a resposta da API com a massa esperada;
7. comparar o resultado com o banco de dados.

### Resultado final

```text
Resultado esperado no banco
          =
Resultado retornado pela API
          =
Resultado identificado na UI
```

---

## 5. UI — cenários positivos

| ID | Tipo | Massa | Validação obrigatória na tela |
|---|---|---|---|
| UI-POS-TGUID-01 | TGUID | Existente | Seletor mantém TGUID; valor pesquisado correto; transação esperada identificada |
| UI-POS-PGUID-01 | PGUID | Existente | Seletor mantém PGUID; valor pesquisado correto; perfil esperado identificado |
| UI-POS-CPF-01 | CPF | Existente | CPF pesquisado identifica o perfil esperado |
| UI-POS-EXTERNAL-01 | ID externo | Existente | ID externo identifica o perfil esperado |
| UI-POS-EXTERNAL-02 | ID externo relacionado | Transação recriada pelo Trust com `relatedExternalIds` | Busca identifica a transação aceita e não mantém como resultado principal a transação rejeitada |
| UI-POS-EXTERNAL-03 | ID externo nativo | Campo nativo e campo configurado coexistem | Cada opção aparece uma vez e identifica o registro pela origem correta |
| UI-POS-BIRTHDATE-01 | Data de nascimento | Existente com resultados | Data identifica todos os perfis esperados |
| UI-POS-NAME-01 | Nome | Existente com resultados | Nome identifica todos os perfis esperados |
| UI-POS-CIB-01 | CIB | Existente | CIB identifica o perfil esperado |
| UI-POS-DYNAMIC-01 | Cada opção dinâmica | Existente | Campo identifica os registros esperados |
| UI-POS-COMMON-01 | Todos | Um resultado | Contagem visual igual a 1 e item correto |
| UI-POS-COMMON-02 | Aplicáveis | Vários resultados | Contagem e todos os itens conferem; sem duplicidade |
| UI-POS-COMMON-03 | Todos | Resultado válido | Parâmetros mostrados na tela correspondem à busca enviada |
| UI-POS-COMMON-04 | Todos | Duas buscas consecutivas | Segunda busca substitui corretamente a primeira |
| UI-POS-COMMON-05 | Todos | Resultado paginado | Total, página e itens correspondem à API |
| UI-POS-CONFIG-01 | Chave | `alwaysSearchExternalIDS=false/true` | Resultado respeita a estratégia configurada para chave e ID externo |
| UI-POS-CONFIG-02 | Resultados | `listFields` configurado | Lista apresenta exatamente os campos configurados |
| UI-POS-CONFIG-03 | Resultados | `showField.tguid=false/true` | Visibilidade do TGUID respeita a configuração |

### Regra da assertiva de UI

Para cada resultado, validar preferencialmente um identificador estável, como `PGUID` ou `TGUID`. Texto visual não deve ser a única forma de provar que o registro correto foi encontrado.

---

## 6. UI — cenários negativos

| ID | Tipo | Massa/ação | Resultado esperado na tela |
|---|---|---|---|
| UI-NEG-TGUID-01 | TGUID | Inexistente, mas bem formatado | Nenhum resultado; nenhum registro anterior permanece visível |
| UI-NEG-TGUID-02 | TGUID | Formato inválido | Validação ou resposta controlada; sem erro técnico |
| UI-NEG-PGUID-01 | PGUID | Inexistente, mas bem formatado | Nenhum resultado |
| UI-NEG-PGUID-02 | PGUID | Formato inválido | Validação ou resposta controlada |
| UI-NEG-PGUID-03 | PGUID | Pessoa excluída | Nenhum perfil ativo é apresentado |
| UI-NEG-CPF-01 | CPF | Inexistente, mas válido | Nenhum resultado |
| UI-NEG-CPF-02 | CPF | Inválido | Validação ou nenhum resultado, conforme contrato |
| UI-NEG-EXTERNAL-01 | ID externo | Inexistente | Nenhum resultado |
| UI-NEG-EXTERNAL-02 | ID externo | Caracteres fora da regra | Tratamento controlado |
| UI-NEG-EXTERNAL-03 | ID externo | Campo configurado com descrição igual ao ID externo nativo | Dropdown não duplica ambiguamente a opção e a pesquisa não quebra |
| UI-NEG-BIRTHDATE-01 | Data de nascimento | Data sem registros | Nenhum resultado |
| UI-NEG-BIRTHDATE-02 | Data de nascimento | Data inválida/impossível | Validação sem chamada indevida ou erro controlado |
| UI-NEG-NAME-01 | Nome | Nome inexistente | Nenhum resultado |
| UI-NEG-NAME-02 | Nome | Caracteres especiais/injeção | Conteúdo não executa; tela permanece íntegra |
| UI-NEG-CIB-01 | CIB | Inexistente | Nenhum resultado |
| UI-NEG-CIB-02 | CIB | Formato inválido | Tratamento controlado |
| UI-NEG-DYNAMIC-01 | Cada opção dinâmica | Valor inexistente | Nenhum resultado |
| UI-NEG-COMMON-01 | Todos | Valor vazio | Pesquisa bloqueada; base completa não é retornada |
| UI-NEG-COMMON-02 | Todos | Apenas espaços | Tratado como vazio |
| UI-NEG-COMMON-03 | Todos | Valor acima do limite | Validação controlada; UI não quebra |
| UI-NEG-COMMON-04 | Todos | API retorna erro | Mensagem compreensível; resultado antigo não é apresentado como novo |
| UI-NEG-COMMON-05 | Todos | API demora/timeout | Estado de carregamento termina e erro é informado |
| UI-NEG-COMMON-06 | Tela | Nenhuma chave selecionada | Pesquisa bloqueada |

---

## 7. API — contrato a capturar por tipo

O projeto já observou as chamadas:

- `POST /service/profile/list/count`;
- `POST /service/profile/list?first=0&size=20`;
- corpo no formato `{ name, value, kind }` para buscas que passam por `profile/list`;
- CPF com `kind: "KEY"`;
- ID externo com `kind: "EXTERNAL_ID"`.

`TGUID` e `PGUID` podem usar navegação ou endpoints diferentes. O teste deve capturar a chamada real do navegador para cada seletor antes de fixar o contrato.

### Matriz obrigatória de mapeamento

| Tipo | `name` | `kind` | Endpoint real | Método | Origem da confirmação |
|---|---|---|---|---|---|
| TGUID | A capturar | A capturar | A capturar | A capturar | Rede da UI + backend |
| PGUID | A capturar | A capturar | A capturar | A capturar | Rede da UI + backend |
| CPF | `cpf` | `KEY` | `/service/profile/list*` | POST | Já observado; reconfirmar |
| ID externo | `EXTERNAL.ID` | `EXTERNAL_ID` | `/service/profile/list*` | POST | Já observado; reconfirmar |
| Data de nascimento | `birthdate` | `BIOGRAPHIC` | `/service/profile/list*` | POST | Documentação de campos + reconfirmar na rede |
| Nome | `name` | `BIOGRAPHIC` | `/service/profile/list*` | POST | Documentação de campos + reconfirmar na rede |
| CIB | `cib` | `KEY` | `/service/profile/list*` | POST | Modelo de chave + reconfirmar na rede |
| Dinâmicos | Lido do seletor | Lido do mapeamento | A capturar | A capturar | Rede da UI + configuração |

---

## 8. API — cenários positivos

| ID | Tipo | Chamada | Validação obrigatória |
|---|---|---|---|
| API-POS-TGUID-01 | TGUID | Valor existente | HTTP esperado; transação e TGUID corretos |
| API-POS-PGUID-01 | PGUID | Valor existente | HTTP esperado; perfil e PGUID corretos |
| API-POS-CPF-01 | CPF | `{name: cpf, value, kind: KEY}` | Perfil esperado e conteúdo consistente com o banco |
| API-POS-EXTERNAL-01 | ID externo | `{name: EXTERNAL.ID, value, kind: EXTERNAL_ID}` | Perfil esperado e conteúdo consistente com o banco |
| API-POS-EXTERNAL-02 | ID externo relacionado | Transação aceita contém `relatedExternalIds` | Busca resolve o registro/transação atual após tratamento no Trust |
| API-POS-EXTERNAL-03 | ID externo configurado como chave | Campo vindo de `sphinx.fields` | Usa contrato de chave configurada sem confundir com endpoint nativo de External ID |
| API-POS-BIRTHDATE-01 | Data de nascimento | Contrato capturado | Todos os perfis daquela massa retornados |
| API-POS-NAME-01 | Nome | Contrato capturado | Todos os perfis esperados retornados |
| API-POS-CIB-01 | CIB | Contrato capturado | Perfil esperado retornado |
| API-POS-DYNAMIC-01 | Cada opção dinâmica | Contrato do campo | Registros esperados retornados |
| API-POS-COMMON-01 | Aplicáveis | `count` e `list` | Total do `count` igual ao total lógico da lista |
| API-POS-COMMON-02 | Aplicáveis | Paginação `first/size` | Limites respeitados; páginas sem duplicidade |
| API-POS-COMMON-03 | Todos | Repetição da mesma chamada | Resultado determinístico enquanto a base não muda |
| API-POS-COMMON-04 | Todos | Sessão autorizada | Resposta não contém campos além dos permitidos ao perfil |
| API-POS-CONFIG-01 | Chave/ID externo | Alternar `alwaysSearchExternalIDS` | Backend consulta somente as origens previstas pela configuração |

---

## 9. API — cenários negativos

| ID | Tipo | Chamada inválida/negativa | Validação obrigatória |
|---|---|---|---|
| API-NEG-TGUID-01 | TGUID | Valor inexistente | Resposta vazia/404 conforme contrato; sem outro registro |
| API-NEG-TGUID-02 | TGUID | Formato inválido | 4xx ou vazio conforme contrato documentado |
| API-NEG-PGUID-01 | PGUID | Valor inexistente | Resposta vazia/404; sem outro perfil |
| API-NEG-PGUID-02 | PGUID | Formato inválido | Erro controlado |
| API-NEG-PGUID-03 | PGUID | Pessoa excluída | Não retorna perfil ativo nem dados residuais indevidos |
| API-NEG-CPF-01 | CPF | Valor inexistente | `count = 0` e lista vazia |
| API-NEG-CPF-02 | CPF | `kind` incorreto | Requisição rejeitada ou sem resultado; nunca resultado de outra categoria |
| API-NEG-EXTERNAL-01 | ID externo | Valor inexistente | `count = 0` e lista vazia |
| API-NEG-EXTERNAL-02 | ID externo | `name`/`kind` incorreto | Requisição rejeitada ou resposta vazia controlada |
| API-NEG-EXTERNAL-03 | ID externo | Colisão entre External ID nativo e chave configurada | Cada contrato consulta sua origem; nenhum erro 500 ou resultado cruzado |
| API-NEG-BIRTHDATE-01 | Data de nascimento | Data inválida | 4xx controlado ou lista vazia conforme contrato |
| API-NEG-NAME-01 | Nome | Payload com caracteres especiais | Sem execução/injeção; resposta segura |
| API-NEG-CIB-01 | CIB | Valor inexistente | Resposta vazia |
| API-NEG-DYNAMIC-01 | Campo dinâmico | Mapeamento inválido | Erro controlado; sem consulta ampla |
| API-NEG-COMMON-01 | Todos | `value` ausente, vazio, nulo e espaços | Não retorna toda a base |
| API-NEG-COMMON-02 | Todos | `name` ausente ou desconhecido | 4xx controlado; sem stack trace |
| API-NEG-COMMON-03 | Aplicáveis | `kind` ausente ou desconhecido | 4xx controlado ou comportamento documentado |
| API-NEG-COMMON-04 | Todos | Sem token | 401; nenhum dado retornado |
| API-NEG-COMMON-05 | Todos | Token inválido/expirado | 401; nenhum dado retornado |
| API-NEG-COMMON-06 | Todos | Usuário sem permissão de busca | 403; nenhum dado retornado |
| API-NEG-COMMON-07 | Todos | `first` negativo / `size` zero ou excessivo | Validação e limites controlados |
| API-NEG-COMMON-08 | Todos | Payload muito grande | Rejeição controlada; serviço permanece disponível |

---

## 10. Banco de dados — validação

O acesso do teste ao banco deve ser **somente leitura**.

### Objetivo

Para uma entrada de busca, obter previamente:

- quantidade esperada;
- lista esperada de `PGUIDs`;
- lista esperada de `TGUIDs`, quando aplicável;
- valor normalizado usado pela busca;
- campo/tabela de origem;
- evidência da consulta sem dados sensíveis desnecessários.

### Casos de consistência

| ID | Verificação | Resultado esperado |
|---|---|---|
| DB-POS-01 | Buscar massa existente por cada tipo | Banco retorna pelo menos um registro conhecido |
| DB-POS-02 | Comparar quantidade Banco × API | Quantidades iguais conforme filtros e paginação |
| DB-POS-03 | Comparar identificadores Banco × API | Mesmos `PGUIDs`/`TGUIDs`, sem falta ou excesso |
| DB-POS-04 | Comparar API × UI | UI identifica todos os itens retornados pela API |
| DB-POS-05 | Validar campos nulos/duplicados | Comportamento conhecido e sem duplicação visual indevida |
| DB-NEG-01 | Gerar valor inexistente | Consulta confirma zero registro antes do teste negativo |
| DB-NEG-02 | Banco indisponível para o gerador | Geração falha explicitamente; teste não usa massa incerta |
| DB-NEG-03 | Massa mudou entre geração e execução | Teste detecta desatualização e regenera a massa |

### Mapeamento de banco pendente

Antes de implementar as consultas, registrar para cada tipo:

| Tipo | Schema/tabela | Coluna | Normalização | Regra de ativo/visível |
|---|---|---|---|---|
| TGUID | A mapear | A mapear | A mapear | A mapear |
| PGUID | A mapear | A mapear | A mapear | A mapear |
| CPF | A mapear | A mapear | Pontuação/zeros a confirmar | A mapear |
| ID externo | A mapear | A mapear | Case sensitivity a confirmar | A mapear |
| Data de nascimento | A mapear | A mapear | Formato/timezone a confirmar | A mapear |
| Nome | A mapear | A mapear | Acentos/case/parte do nome a confirmar | A mapear |
| CIB | A mapear | A mapear | A mapear | A mapear |
| Labels/dinâmicos | A mapear | A mapear | Por configuração | A mapear |

---

## 11. Gerador de massa de busca

**Implementado nesta fase:** `npm run massa:smart` seleciona processos já indexados no SMART,
lê `ProcessId/Tguid/Pguid` no banco e completa os biográficos pela API oficial. A saída real é
`test-data/generated/intelligence.busca.massa.json`, ignorada pelo Git. O código bloqueia SQL de
escrita e não registra token, senha ou corpo completo da API.

### Princípio

O gerador não deve simplesmente criar valores aleatórios e assumir o resultado. Ele deve:

1. consultar o banco em modo leitura;
2. escolher registros existentes e estáveis;
3. calcular os resultados esperados;
4. criar também valores inexistentes comprovados;
5. salvar um JSON consumido pelos testes de UI e API.

### Saída esperada

```json
{
  "generatedAt": "2026-08-14T00:00:00.000Z",
  "environment": "qa",
  "release": "5.5.0.5062",
  "searches": [
    {
      "type": "CPF",
      "selector": {
        "label": "cpf",
        "value": "cpf",
        "name": "cpf",
        "kind": "KEY"
      },
      "positive": {
        "input": "VALOR_MASCARADO",
        "expectedCount": 1,
        "expectedPguids": ["PGUID_MASCARADO"],
        "expectedTguids": []
      },
      "negative": {
        "nonexistentValid": "VALOR_INEXISTENTE",
        "invalidValues": ["", "FORMATO_INVALIDO"]
      }
    }
  ]
}
```

O arquivo real pode conter identificadores necessários à execução, mas não deve ser versionado nem anexado sem mascaramento.

### Estratégia por tipo

| Tipo | Positivo gerado | Negativo gerado |
|---|---|---|
| TGUID | Transação existente e estável | GUID bem formatado confirmado como inexistente + formatos inválidos |
| PGUID | Perfil existente e visível | GUID bem formatado confirmado como inexistente + formatos inválidos |
| CPF | CPF associado a perfil conhecido | CPF válido inexistente + CPF inválido |
| ID externo | ID associado a perfil conhecido | ID inexistente + caracteres/limites inválidos |
| Data de nascimento | Data com resultado conhecido e, se possível, múltiplos perfis | Data válida sem resultado + data impossível |
| Nome | Nome com um resultado e nome com vários resultados | Nome inexistente + payloads especiais seguros |
| CIB | CIB associado a perfil conhecido | CIB inexistente + formato inválido |
| Dinâmicos | Valor existente conforme campo configurado | Valor inexistente e inválido conforme o campo |

### Regras de segurança do gerador

- conexão de banco com usuário somente leitura;
- credenciais apenas em `.env.local` ou cofre do pipeline;
- nunca imprimir senha, token, CPF completo ou biometria nos logs;
- `test-data/generated/` deve estar no `.gitignore`;
- registrar hash ou versão da massa para detectar mudança;
- falhar como **BLOQUEADO** quando não houver massa confiável;
- não inserir, atualizar ou excluir registros no GBDS nesta primeira versão.

### Quando não houver massa no banco

O gerador deve informar exatamente qual tipo ficou sem massa. A criação de novos registros deverá ser feita por um provisionador separado, através do fluxo responsável (SMART/GBDS), e não por `INSERT` direto no banco.

---

## 12. Execução por camadas

### Fase 1 — Gerar massa

```text
Banco → gerar JSON → validar que cada tipo possui positivo e negativo
```

### Fase 2 — API

```text
JSON → chamar cada contrato → comparar quantidade e identificadores com o banco
```

### Fase 3 — UI

```text
JSON → selecionar chave → preencher valor → pesquisar
     → interceptar API → comparar resposta e resultado visível
```

### Fase 4 — Resultado consolidado

| Tipo | Massa | Banco | API positiva | API negativa | UI positiva | UI negativa |
|---|---|---|---|---|---|---|
| TGUID | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| PGUID | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| CPF | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| ID externo | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| Data de nascimento | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| Nome | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| CIB | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| Dinâmicos | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |

---

## 13. Cobertura confrontada com Confluence e Jira

Levantamento realizado em 14/08/2026 no projeto Jira `INT` e na documentação interna do Intelligence.

### Requisitos de busca confirmados

| Fonte | Requisito encontrado | Cobertura no plano |
|---|---|---|
| Testes Release 1.8.0/1.8.1 | Buscar por PGUID, TGUID, chaves, External ID, campo configurado e valor inexistente | Coberto nas matrizes UI/API positivas e negativas |
| Testes Release 1.8.0/1.8.1 | Buscar PGUID de pessoa excluída | `UI-NEG-PGUID-03` e `API-NEG-PGUID-03` |
| INT-17 | Listar transações por chave e External ID no GBDS Client v5 | `UI/API-POS-CPF`, `EXTERNAL` e tipos dinâmicos |
| Configurações Intelligence | `listFields`, `showField.tguid` e `alwaysSearchExternalIDS` alteram busca/listagem | `UI-POS-CONFIG-01` a `03` e `API-POS-CONFIG-01` |
| INT-95/INT-97 | External ID pode migrar para `relatedExternalIds` após tratamento no Trust | `UI/API-POS-EXTERNAL-02` |
| INT-98 | Colisão entre External ID nativo e campo de mesmo nome em `sphinx.fields` duplica opção e quebra busca | `UI/API-NEG-EXTERNAL-03` |
| INT-100 | Usuário view-only não pode chamar `/profile/list/count` e `/profile/list` | `API-NEG-COMMON-06` e validação da ausência da busca |

### Conclusão de cobertura

O plano cobre o **módulo de busca** com as lacunas históricas mais relevantes encontradas. Ele não cobre a aplicação completa, por decisão de escopo desta fase.

| Área existente no Intelligence | Exemplos de fontes | Situação nesta fase |
|---|---|---|
| Busca e listagem | Release 1.8, INT-17, INT-95, INT-97, INT-98 | **Dentro do escopo** |
| Detalhe de perfil/transação e histórico | INT-4, INT-24, INT-49, INT-69, INT-70 | Adiado |
| Biometrias e conversão de imagens | INT-64, INT-91, INT-99 | Adiado |
| Exportação e visualização NIST | INT-1, INT-12, INT-26, INT-30, INT-66, INT-67, INT-78 | Adiado |
| Edição de biográficos | INT-6, INT-31, INT-39 a INT-48, INT-58, INT-61 | Adiado |
| Exclusão/atualização de chaves e perfis | INT-83 a INT-90, INT-101 | Adiado |
| HITs do BEST | INT-68, INT-71, INT-72, INT-76, INT-77, INT-93 | Adiado |
| Autenticação, permissões e URL view-only | INT-15, INT-46, INT-58, INT-60, INT-100 | Somente pré-condição e bloqueio da busca |
| Traduções, preferências e status | INT-11, INT-25, INT-45, INT-82, INT-92 | Adiado |

---

## 14. Critérios de aceite desta fase

- todas as opções reais do seletor estão catalogadas;
- cada tipo possui massa positiva e negativa comprovada no banco;
- contrato HTTP de cada tipo foi capturado e documentado;
- todos os cenários positivos e negativos de API foram executados;
- todos os cenários positivos e negativos da UI foram executados na única Tela de Busca;
- quantidade e identificadores são iguais entre Banco, API e UI;
- nenhum valor vazio ou inválido retorna a base completa;
- nenhum token, credencial ou dado pessoal sensível aparece nas evidências;
- falhas de ambiente/massa são classificadas como **Bloqueado**, não como defeito da aplicação.

---

## 15. Pendências para completar a implementação

1. configurar no `.env.local` a API e o banco somente leitura do SMART e executar `npm run massa:smart`;
2. capturar a rede da UI para `TGUID`, `PGUID` e campos dinâmicos;
3. confirmar formatos válidos e regras de normalização por identificador;
4. confirmar como a UI apresenta os identificadores estáveis de cada resultado;
5. quando faltar massa indexada, provisionar pelo fluxo oficial SMART → captura → GBDS; nunca por SQL.

---

## 16. Referências

- [Manual oficial do GBS Intelligence](https://docs.griaule.com/aplicacoes/intelligenceweb)
- [Integração oficial do GBDS](https://docs.griaule.com/gbs/en/gbds-integration/gbsintegration)
- [Testes Release Intelligence 1.8.0/1.8.1](https://griaule.atlassian.net/wiki/spaces/dev/pages/283770893/Testes+Release+Intelligence+1.8.0+1.8.1)
- [Configurações Intelligence](https://griaule.atlassian.net/wiki/spaces/dev/pages/609878024/Configura+es+Intelligence)
- [SMART — API de Autenticação](https://griaule.atlassian.net/wiki/spaces/dev/pages/852230156/SMART+-+API+de+Autentica+o)
- [SMART — Documentação de processos](https://griaule.atlassian.net/wiki/spaces/dev/pages/644415542/SMART+-+Documenta+o+de+processos)
- [INT-17 — Atualização para GBDS Client v5](https://griaule.atlassian.net/browse/INT-17)
- [INT-95 — relatedExternalIds](https://griaule.atlassian.net/browse/INT-95)
- [INT-97 — pesquisa por chave externa/relatedExternalID](https://griaule.atlassian.net/browse/INT-97)
- [INT-98 — colisão com ID externo configurado](https://griaule.atlassian.net/browse/INT-98)
- [INT-100 — visualização view-only por URL](https://griaule.atlassian.net/browse/INT-100)
- helpers e testes Playwright deste repositório.
