import { expect } from '@playwright/test';

import {
  autenticarIntelligenceApi,
  extrairCamposBusca,
  listarCamposBuscaIntelligence,
} from '../../../../utils/api/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';

registrarCaso('API-POS-FIELDS-01', async (world) => {
  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resposta = await listarCamposBuscaIntelligence(request, sessionGuid);
  expect(resposta.response.status()).toBe(200);

  const campos = extrairCamposBusca(resposta.body);
  expect(campos.length).toBeGreaterThan(0);
  expect(new Set(campos.map((campo) => campo.name.toLowerCase())).size).toBe(campos.length);
});

registrarCaso('API-NEG-FIELDS-AUTH-01', async (world) => {
  expect((await listarCamposBuscaIntelligence(await world.api())).response.status()).toBe(401);
});

registrarCaso('API-NEG-FIELDS-AUTH-02', async (world) => {
  expect(
    (await listarCamposBuscaIntelligence(await world.api(), 'session-guid-invalido')).response.status(),
  ).toBe(401);
});
