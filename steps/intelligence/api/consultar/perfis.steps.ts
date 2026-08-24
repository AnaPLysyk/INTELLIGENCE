import { expect } from '@playwright/test';

import {
  autenticarIntelligenceApi,
  obterDetalhesPerfilIntelligence,
} from '../../../../utils/api/intelligence';
import { obterCredenciaisParaPerfilIntelligence } from '../../../../utils/auth/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';

registrarCaso('API-POS-PROFILE-VIEWONLY-01', async (world) => {
  await world.garantirMassa();
  const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);
  const request = await world.api();
  const credenciais = await obterCredenciaisParaPerfilIntelligence(request, 'view-only');
  const sessionGuid = await autenticarIntelligenceApi(request, credenciais);
  const resposta = await obterDetalhesPerfilIntelligence(request, pguid, sessionGuid);
  expect(
    resposta.response.status(),
    'O backend deve carregar o perfil solicitado para o usuario view-only.',
  ).toBe(200);
});

registrarCaso('API-NEG-PROFILE-NOTFOUND-01', async (world) => {
  const request = await world.api();
  const credenciais = await obterCredenciaisParaPerfilIntelligence(request, 'view-only');
  const sessionGuid = await autenticarIntelligenceApi(request, credenciais);
  const resposta = await obterDetalhesPerfilIntelligence(
    request,
    crypto.randomUUID().toUpperCase(),
    sessionGuid,
  );
  expect(
    resposta.response.status(),
    'profile/person nao deve provocar erro interno para PGUID inexistente.',
  ).toBeLessThan(500);
});
