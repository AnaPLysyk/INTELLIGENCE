# Utils

Infraestrutura que não representa uma página da aplicação.

```text
utils/
  api/       -> clients HTTP
  database/  -> consultas/repositories de banco
  auth/      -> credenciais e resolução de perfis
  data/      -> massas e dados de teste
```

Nesta primeira etapa os arquivos são fachadas para o código existente em `support/`, evitando uma migração grande antes da regressão.
