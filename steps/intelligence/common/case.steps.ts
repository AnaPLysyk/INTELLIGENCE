import { Given, Then, When } from '@cucumber/cucumber';

import type { IntelligenceWorld } from '../../../cucumber/world';
import { executarCaso } from '../../../utils/common/case-registry';

Given('que o caso {string} está preparado', function (this: IntelligenceWorld, id: string) {
  this.caseId = id;
});

Given('que o caso automatizado está preparado', function (this: IntelligenceWorld) {
  if (!this.caseId) throw new Error('AUTOMATION ERROR: cenário sem identificação @case-<ID>.');
});

When('executo o comportamento automatizado do caso', async function (this: IntelligenceWorld) {
  if (!this.caseId) throw new Error('AUTOMATION ERROR: cenário sem identificação de caso.');
  await this.registrarCaso(this.caseId, 'Execução Cucumber direta pela camada correspondente.');
  await executarCaso(this.caseId, this);
});

Then('o contrato automatizado deve ser atendido', function () {
  // A implementação registrada do caso contém as asserções funcionais.
});
