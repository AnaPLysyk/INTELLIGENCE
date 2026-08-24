import { Given, Then, When } from '@cucumber/cucumber';

import type { IntelligenceWorld } from '../../../cucumber/world';
import { executarCaso, obterCasoRegistrado } from '../../../utils/common/case-registry';

const CHAVE_BDD_EXECUTADO = 'bdd:caso-executado';

function exigirCaseId(world: IntelligenceWorld): string {
  if (!world.caseId) {
    throw new Error('AUTOMATION ERROR: cenário sem identificação @case-<ID>.');
  }
  return world.caseId;
}

async function executarCasoAtual(world: IntelligenceWorld): Promise<void> {
  if (world.state.get(CHAVE_BDD_EXECUTADO) === true) return;

  const id = exigirCaseId(world);
  const caso = obterCasoRegistrado(id);
  await world.registrarCaso(caso.id, caso.nome);
  await executarCaso(caso.id, world);
  world.state.set(CHAVE_BDD_EXECUTADO, true);
}

function confirmarExecucao(world: IntelligenceWorld): void {
  if (world.state.get(CHAVE_BDD_EXECUTADO) !== true) {
    throw new Error(`AUTOMATION ERROR: comportamento do caso ${exigirCaseId(world)} ainda não foi executado.`);
  }
}

// Compatibilidade com Features ainda não migradas para o BDD descritivo.
Given('que o caso {string} está preparado', function (this: IntelligenceWorld, id: string) {
  this.caseId = id;
});

Given('que o caso automatizado está preparado', function (this: IntelligenceWorld) {
  exigirCaseId(this);
});

When('executo o comportamento automatizado do caso', async function (this: IntelligenceWorld) {
  await executarCasoAtual(this);
});

Then('o contrato automatizado deve ser atendido', function (this: IntelligenceWorld) {
  confirmarExecucao(this);
});

// -----------------------------------------------------------------------------
// INT-100 — adaptador BDD descritivo
//
// As Features agora descrevem contexto/ação/resultado em linguagem de negócio.
// A implementação funcional continua centralizada nos casos registrados em
// steps/intelligence/{api,ui}/..., evitando duplicar POM/Utils/asserts durante
// a migração. O primeiro Quando executa o caso real identificado por @case-*;
// os Então apenas confirmam que o contrato executável foi concluído.
// -----------------------------------------------------------------------------

const contextosInt100 = [
  'que sou usuário administrador',
  'insiro critério válido de pesquisa',
  'que tenho permissão view-only',
  'um PGUID válido de perfil',
  'um PGUID que não existe',
  'que sou usuário view-only',
  'estou em qualquer página da aplicação',
  'acesso um perfil',
  'que acesso deep-link com PGUID inexistente',
  'acesso deep-link de transação com TGUID válido',
  'que possuo credenciais de usuário sem permissão Intelligence',
] as const;

for (const texto of contextosInt100) {
  Given(texto, function (this: IntelligenceWorld) {
    exigirCaseId(this);
  });
}

const acoesInt100 = [
  'executo a busca',
  'executo busca',
  'consulto o perfil pela API',
  'executo requisições POST/PUT para endpoints de escrita',
  'acesso a página principal',
  'acesso menu de configurações',
  'acesso uma rota não existente',
  'clico no logo no header',
  'a página carrega',
  'a página tenta carregar',
  'tento acessar a aplicação',
] as const;

for (const texto of acoesInt100) {
  When(texto, async function (this: IntelligenceWorld) {
    await executarCasoAtual(this);
  });
}

Then('recebo resposta com status {int}', function (this: IntelligenceWorld, _status: number) {
  confirmarExecucao(this);
});

Then('recebo resposta com status diferente de {int}', function (this: IntelligenceWorld, _status: number) {
  confirmarExecucao(this);
});

Then('todas as requisições retornam status {int}', function (this: IntelligenceWorld, _status: number) {
  confirmarExecucao(this);
});

const resultadosInt100 = [
  'recebo resultados na interface',
  'os dados do perfil são retornados',
  'a função de busca não é exibida',
  'consigo alterar preferências de tema e visualização',
  'sou redirecionado para a página inicial',
  'sou navegado para a página inicial',
  'visualizo dados em modo somente leitura sem controles de escrita',
  'visualizo mensagem de erro apropriada',
  'visualizo transação sem controles de edição',
  'sou impedido de criar sessão e redirecionado',
] as const;

for (const texto of resultadosInt100) {
  Then(texto, function (this: IntelligenceWorld) {
    confirmarExecucao(this);
  });
}
