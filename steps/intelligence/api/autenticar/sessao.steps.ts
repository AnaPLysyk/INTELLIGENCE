import { expect } from '@playwright/test';

import { solicitarSessaoIntelligenceApi } from '../../../../utils/api/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';

registrarCaso('API-NEG-LOGIN-01', async (world) => {
  const resposta = await solicitarSessaoIntelligenceApi(await world.api(), {
    username: `usuario-inexistente-${Date.now()}`,
    password: 'senha-invalida-regressao',
  });
  expect([400, 401, 403]).toContain(resposta.response.status());
});

registrarCaso('API-NEG-LOGIN-02', async (world) => {
  const resposta = await solicitarSessaoIntelligenceApi(await world.api(), {
    username: '',
    password: '',
  });
  expect([400, 401, 403]).toContain(resposta.response.status());
});
