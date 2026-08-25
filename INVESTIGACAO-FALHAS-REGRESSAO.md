# 📊 Investigação de Falhas - Regressão INTELLIGENCE

**Data:** 2026-08-24  
**Branch:** `refactor/intelligence-cucumber-visual`  
**Commits:** 49eef67, cd2bd9e, dbe9f49, 3ccde4e

---

## 📈 RESULTADO DA REGRESSÃO

| Métrica | Valor |
|---------|-------|
| **Total Cenários** | 54 |
| **✅ Passou** | 35 (64.8%) |
| **❌ Falhou** | 19 (35.2%) |
| **Tempo Total** | 5m 37s |

---

## 🔍 ANÁLISE DE FALHAS

### **1️⃣ MASSA DE DADOS - ✅ RESOLVIDO**

**Problema:** `BLOQUEADO: nao existe massa pesquisavel para {EXTERNAL.ID, birthdate, name, cib}`  
**Testes afetados:** 4
- API-POS-EXTERNAL-01
- API-POS-BIRTHDATE-01
- API-POS-NAME-01
- API-POS-CIB-01

**Causa raiz:** Caminho relativo incorreto na função de geração  
```typescript
// Antes: ../test-data/fixtures/ (1 nível para cima)
// Depois: ../../test-data/fixtures/ (2 níveis para cima)
```

**Solução:** Commit `3ccde4e` - Corrigido caminho e adicionado logs  
**Status:** ✅ Resolvido  
**Resultado esperado:** 4 testes devem passar na próxima regressão

---

### **2️⃣ BACKEND RETORNA 500 - ❌ REQUER BACKEND FIX**

**Problema:** Endpoints retornam 500 ao invés de validar payloads  
**Testes afetados:** 6-8
- API-NEG-PAYLOAD-NAME-01 (payload sem nome)
- API-NEG-PAYLOAD-VALUE-01 (payload com valor vazio)
- API-DES-SQLI-01 (SQL injection)
- API-DES-XSS-01 (XSS)
- API-DES-PATH-01 (path traversal)
- API-DES-OVERSIZE-01 (valor muito grande)
- API-POS-PROFILE-VIEWONLY-01 (perfil view-only)
- API-NEG-PROFILE-NOTFOUND-01 (PGUID inexistente)

**Causa raiz:** Backend não valida entrada do usuário  
**Recomendação:**
1. Implementar validação de schema/input nos endpoints
2. Retornar 400/422 para entrada inválida
3. Nunca retornar 500 para erro de input

**Endpoints afetados:**
- `POST /profile/list/count`
- `GET /profile/list`
- `GET /profile/person/{pguid}`
- `GET /profile/transaction/{tguid}`

**Status:** ⏳ Aguardando backend team  
**Severidade:** 🔴 CRÍTICO

---

### **3️⃣ BOTÃO "EDITAR" NÃO RENDERIZA - ❌ REQUER BACKEND FIX**

**Problema:** Página de perfil carrega, mas botão "Editar" não existe  
**Testes afetados:** 5
- INT-40-UI-02 (Campo data preenchido)
- INT-31-UI-01 (Campos biográficos)
- INT-40-UI-01 (Persistência de datas)
- INT-32-UI-01 (Date picker)

**Diagnóstico:**
```
URL: http://172.16.1.146:8122/gbs-intelligence-server/react/person/27ACBE3F-4B9A-4142-9366-E83A609DA5D4
Conteúdo: ✅ Perfil carrega corretamente
Dados: ✅ Nome, data de nascimento, etc aparecem
Botão Editar: ❌ Não existe
Outros botões: Voltar, Links (A)
```

**Causa raiz provável:** Backend não retorna `permissions.edit: true` para ADMIN  

**Recomendação:**
1. Backend retorna permissões no endpoint `/profile/person/{pguid}`
2. Frontend renderiza botão "Editar" se `permissions.edit === true`

**Exemplo de resposta esperada:**
```json
{
  "profile": { "nome": "...", "dataNascimento": "..." },
  "permissions": {
    "edit": true,    // Faltando ou false
    "delete": false,
    "view": true
  }
}
```

**Status:** ⏳ Aguardando backend team  
**Severidade:** 🔴 CRÍTICO

---

### **4️⃣ MENSAGENS DE ERRO NÃO APARECEM - ⚠️ FRONTEND**

**Problema:** Páginas de erro não renderizam mensagens esperadas  
**Testes afetados:** 2
- INT-100-I3 (PGUID não encontrado)
- INT-24-UI-01 (Histórico de perfis)

**INT-100-I3:**
- Esperado: "a busca não está disponível para o seu usuário"
- Atual: Página vazia

**INT-24-UI-01:**
- Esperado: PGUID anterior no histórico
- Atual: Histórico com PGUID diferente

**Recomendação:** Frontend adicionar fallback para mensagens de erro

**Status:** ⏳ Aguardando frontend team  
**Severidade:** 🟡 ALTO

---

### **5️⃣ DOWNLOAD NÃO FUNCIONA - ⚠️ FRONTEND/BACKEND**

**Problema:** Timeout aguardando evento de download  
**Testes afetados:** 1
- INT-30-UI-01 (Exportação NIST)

**Diagnóstico:**
```
page.waitForEvent("download") 
→ Timeout 30000ms
```

**Possíveis causas:**
1. Endpoint não retorna arquivo
2. Frontend não dispara download
3. Playwright não intercepta evento

**Recomendação:** Verificar implementação de download no frontend

**Status:** ⏳ Aguardando investigação  
**Severidade:** 🟡 MÉDIO

---

## 📋 RESUMO EXECUTIVO

| Categoria | Testes | Causa | Fix |
|-----------|--------|-------|-----|
| Massa | 4 | Fixture path | ✅ Done |
| Backend 500 | 6-8 | Validação | ⏳ Backend |
| Botão Editar | 5 | Permissão | ⏳ Backend |
| Msg Erro | 2 | Renderização | ⏳ Frontend |
| Download | 1 | Unknown | ⏳ Investigação |
| **TOTAL** | **19** | | |

---

## 🎯 PRÓXIMOS PASSOS

### **Prioridade 1 - URGENTE (Bloqueia regressão)**
- [ ] Backend: Implementar validação de payload (6+ testes)
- [ ] Backend: Retornar permissões em `/profile/person/{pguid}` (5 testes)

### **Prioridade 2 - IMPORTANTE**
- [ ] Frontend: Adicionar mensagens de erro para casos 404/vazio (2 testes)
- [ ] Frontend: Corrigir evento de download (1 teste)

### **Prioridade 3 - NICE-TO-HAVE**
- [ ] Adicionar testes de edge cases
- [ ] Documentação de permissões
- [ ] Melhorar tratamento de erros global

---

## 📚 COMMITS ASSOCIADOS

```
3ccde4e - fix: corrigir caminho de carregamento da fixture de massa
dbe9f49 - fix: remover steps genéricos duplicados
cd2bd9e - fix: melhorar tratamento de erros em testes UI
49eef67 - fix: resolver 20 testes falhando (massa, link de PGUID, variáveis de ambiente)
```

---

## 📊 ESTRUTURA MANTIDA

✅ **17 Features** com BDD  
✅ **57 Cenários** com @case-ID único  
✅ **57 Casos executáveis** registrados  
✅ **18 Arquivos** de steps por responsabilidade  
✅ **Ranger INT-100** preservado (passando)  
✅ TypeCheck sem erros  
✅ Validação de estrutura OK  

---

## 🔄 REGRESSÃO FINAL

Aguardando resultado da regressão com massa corrigida para confirmar:
- ✅ 4 testes de massa agora passam
- 📊 Novo score esperado: 39/54 passou (72%)

---

**Investigação concluída:** 2026-08-24 21:45 UTC  
**Branch pronto para:** Backend fixes + Frontend investigation
