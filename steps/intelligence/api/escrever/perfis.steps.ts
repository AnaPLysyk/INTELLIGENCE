import { randomUUID } from 'node:crypto';

import { expect } from '@playwright/test';

import {
  autenticarIntelligenceApi,
  obterUrlApiIntelligence,
} from '../../../../utils/api/intelligence';
import { obterCredenciaisParaPerfilIntelligence } from '../../../../utils/auth/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';

type EndpointEscrita = {
  nome: string;
  metodo: 'POST' | 'DELETE';
  path: string;
  body?: unknown;
};

registrarCaso('INT-100-WRITE-ENDPOINTS-01', async (world) => {
  const request = await world.api();
  const credenciais = await obterCredenciaisParaPerfilIntelligence(request, 'view-only');
  const sessionGuid = await autenticarIntelligenceApi(request, credenciais);
  const baseUrl = obterUrlApiIntelligence();

  // UUIDs descartáveis: este teste valida autorização e nunca deve apontar
  // operações de escrita para um PGUID/TGUID real da massa de teste.
  const pguidProbe = randomUUID().toUpperCase();
  const tguidProbe = randomUUID().toUpperCase();

  const endpoints: EndpointEscrita[] = [
    {
      nome: 'consolidate',
      metodo: 'POST',
      path: `/profile/consolidate/${pguidProbe}`,
      body: [],
    },
    {
      nome: 'consolidate-add',
      metodo: 'POST',
      path: `/profile/consolidate/${pguidProbe}/add/${tguidProbe}`,
      body: {},
    },
    {
      nome: 'consolidate-addTguids',
      metodo: 'POST',
      path: `/profile/consolidate/${pguidProbe}/addTguids?tguid=${encodeURIComponent(tguidProbe)}`,
    },
    {
      nome: 'consolidate-minus',
      metodo: 'POST',
      path: `/profile/consolidate/${pguidProbe}/minus/${tguidProbe}`,
      body: {},
    },
    {
      nome: 'updateBio',
      metodo: 'POST',
      path: `/profile/updateBio/${pguidProbe}/${tguidProbe}`,
      body: {
        biographics: [
          {
            name: 'nome',
            value: 'QA_INT100_PERMISSION_PROBE',
          },
        ],
      },
    },
    {
      nome: 'people-keys',
      metodo: 'DELETE',
      path: `/profile/people/${pguidProbe}/keys`,
      body: [
        {
          id: 'cpf',
          value: '00000000000',
        },
      ],
    },
  ];

  for (const endpoint of endpoints) {
    const resposta = await request.fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.metodo,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'session-guid': sessionGuid,
      },
      ...(endpoint.body === undefined ? {} : { data: endpoint.body }),
      timeout: 15_000,
    });

    const responseBody = (await resposta.text()).slice(0, 500);
    console.log(
      `INT100_ENDPOINT_AUTHZ|endpoint=${endpoint.nome}|method=${endpoint.metodo}`
      + `|status=${resposta.status()}|request=${JSON.stringify(endpoint.body)}`
      + `|response=${responseBody}`,
    );

    expect(
      resposta.status(),
      `${endpoint.metodo} ${endpoint.nome} deveria negar intelligence_view_only com HTTP 403. `
      + `Recebido: ${resposta.status()} (${endpoint.path}).`,
    ).toBe(403);
  }
});
