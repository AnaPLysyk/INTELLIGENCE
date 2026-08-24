import { After, AfterAll, Before, setDefaultTimeout, Status } from '@cucumber/cucumber';

import { encerrarNavegadorCompartilhado, IntelligenceWorld } from './world';

setDefaultTimeout(240_000);

Before(function (this: IntelligenceWorld, { pickle }) {
  this.perfil = undefined;
  this.state.clear();
  this.caseId = pickle.tags.map((tag) => tag.name).find((tag) => tag.startsWith('@case-'))?.slice(6);
});

After(async function (this: IntelligenceWorld, { result, pickle }) {
  try {
    if (result?.status === Status.FAILED && this.page) {
      const screenshot = await this.page.screenshot({ fullPage: true }).catch(() => undefined);
      if (screenshot) await this.attach(screenshot, 'image/png');
    }
    if (result?.status === Status.FAILED) {
      await this.attach(`Cenário: ${pickle.name}\nCaso: ${this.caseId || '(sem case-id)'}`, 'text/plain');
    }
  } finally {
    await this.encerrarCenario();
  }
});

AfterAll(async function () {
  await encerrarNavegadorCompartilhado();
});
