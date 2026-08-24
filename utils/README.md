# Utils

Infraestrutura não visual usada pelos Steps.

```text
utils/
  api/           clientes HTTP e parsing de contratos
  auth/          resolução de perfis e credenciais
  database/      consultas somente leitura
  data/          contratos e arquivos de massa
  integrations/  clientes SMART/GBDS
  provisioning/  descoberta e geração segura de massa
  common/        infraestrutura compartilhada de execução
```

`utils/` é implementação canônica; não existem fachadas apontando para uma árvore `support/`.
