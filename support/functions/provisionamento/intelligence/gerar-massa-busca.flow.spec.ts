import { expect, test } from '@playwright/test';

import { gerarMassaDeBuscaComDadosDoSmart } from './gerar-massa-busca.flow';

test('gera massa de busca da Intelligence a partir de processos SMART ja indexados', async ({ request }) => {
  const massa = await gerarMassaDeBuscaComDadosDoSmart(request);
  expect(massa.tiposAusentes).toEqual([]);
});
