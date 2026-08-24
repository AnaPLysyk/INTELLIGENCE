import { Given, Then, When } from '@cucumber/cucumber';

import type { IntelligenceWorld } from '../../../cucumber/world';
import { executarCaso, obterCasoRegistrado } from '../../../utils/common/case-registry';

Given('que o caso {string} está preparado', function (this: IntelligenceWorld, id: string) {
  this.caseId = id;
});

Given('que o caso automatizado está preparado', function (this: IntelligenceWorld) {
  if (!this.caseId) throw new Error('AUTOMATION ERROR: cenário sem identificação @case-<ID>.');
});

When('executo o comportamento automatizado do caso', async function (this: IntelligenceWorld) {
  if (!this.caseId) throw new Error('AUTOMATION ERROR: cenário sem identificação de caso.');

  const caso = obterCasoRegistrado(this.caseId);
  await this.registrarCaso(caso.id, caso.nome);
  await executarCaso(caso.id, this);
});

Then('o contrato automatizado deve ser atendido', function () {
  // As asserções funcionais ficam na implementação registrada do teste.
});
