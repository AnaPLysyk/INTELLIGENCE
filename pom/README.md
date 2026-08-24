# POM

Estrutura visual dos Page Objects do Intelligence.

Cada contexto possui dois arquivos:

- `*.locators.ts`: somente seletores/locators.
- `*.actions.ts`: ações e validações da página.

A implementação existente em `support/functions/ui/intelligence/intelligence.page.ts` foi mantida para reduzir o impacto da refatoração. Os arquivos em `pom/` funcionam como uma camada mais legível e podem substituir o Page Object antigo de forma incremental.

Estrutura inicial:

```text
pom/intelligence/
  login/
  search/
  profile/
  transaction/
  settings/
```
