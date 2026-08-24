import { expect } from '@playwright/test';

import {
  autenticarIntelligenceApi,
  obterUrlApiIntelligence,
} from '../../../../utils/api/intelligence';
import { obterCredenciaisParaPerfilIntelligence } from '../../../../utils/auth/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';

const ENDPOINTS_ESCRITA = [
  { metodo: 'POST', path: '/profile/consolidate' },
  { metodo: 'POST', path: '/profile/consolidate/add' },
  { metodo: 'POST', path: '/profile/consolidate/addTguids' },
  { metodo: 'POST', path: '/profile/consolidate/minus' },
  { metodo: 'PUT', path: '/profile/updateBio' },
  { metodo: 'POST', path: '/profile/people-keys' },
];

registrarCaso('INT-100-WRITE-ENDPOINTS-01', async (world) => {
  await world.garantirMassa();
  const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);
  const request = await world.api();
  const credenciais = await obterCredenciaisParaPerfilIntelligence(request, 'view-only');
  const sessionGuid = await autenticarIntelligenceApi(request, credenciais);
  const urlBase = obterUrlApiIntelligence();

  for (const endpoint of ENDPOINTS_ESCRITA) {
    const url = new URL(endpoint.path, urlBase).toString();
    const resposta = await request.fetch(url, {
      method: endpoint.metodo,
      headers: { 'X-Session-Guid': sessionGuid },
      data: { pguid },
    });

    expect(
      resposta.status(),
      `Endpoint ${endpoint.metodo} ${endpoint.path} deve bloquear usuario view-only com 403.`,
    ).toBe(403);
  }
});
