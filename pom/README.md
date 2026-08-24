# POM

Page Objects oficiais do Intelligence. `pom/` contém exclusivamente comportamento reutilizável de UI: locators, navegação, ações e validações visuais.

```text
pom/intelligence/
  core/
  login/
  search/
  profile/
  transaction/
  settings/
```

Os Steps de UI chamam o POM diretamente. Não existe dependência de `support/`.
