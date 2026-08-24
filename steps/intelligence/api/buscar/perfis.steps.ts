import { expect } from '@playwright/test';

import type { IntelligenceWorld } from '../../../../cucumber/world';
import {
  autenticarIntelligenceApi,
  buscarPerfisIntelligence,
  buscarPerfisIntelligenceComPayloadLivre,
  contemValor,
  extrairContagem,
  extrairItens,
  payloadDaMassa,
  type PayloadBuscaIntelligence,
} from '../../../../utils/api/intelligence';
import { obterCredenciaisParaPerfilIntelligence } from '../../../../utils/auth/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';

const buscas = [
  ['API-POS-CPF-01', 'cpf'],
  ['API-POS-EXTERNAL-01', 'EXTERNAL.ID'],
  ['API-POS-BIRTHDATE-01', 'birthdate'],
  ['API-POS-NAME-01', 'name'],
  ['API-POS-CIB-01', 'cib'],
] as const;

const semDado: PayloadBuscaIntelligence = {
  name: 'cpf',
  value: '00000000000',
  kind: 'KEY',
};

function validarStatus(
  resultado: Awaited<ReturnType<typeof buscarPerfisIntelligence>>,
  esperado: number,
): void {
  expect(resultado.count.response.status()).toBe(esperado);
  expect(resultado.list.response.status()).toBe(esperado);
}

function semErroInterno(status: number, contexto: string): void {
  expect(status, `${contexto} nao deve provocar erro interno.`).toBeLessThan(500);
}

function semExposicao(
  resultado: Awaited<ReturnType<typeof buscarPerfisIntelligenceComPayloadLivre>>,
): void {
  semErroInterno(resultado.count.response.status(), 'count');
  semErroInterno(resultado.list.response.status(), 'list');
  if (resultado.count.response.ok()) expect(extrairContagem(resultado.count.body)).toBe(0);
  if (resultado.list.response.ok()) expect(extrairItens(resultado.list.body)).toHaveLength(0);
}

for (const [id, tipo] of buscas) {
  registrarCaso(id, async (world: IntelligenceWorld) => {
    const massa = await world.garantirMassa();
    const entrada = massa.buscas[tipo];
    if (!entrada) throw new Error(`BLOQUEADO: nao existe massa pesquisavel para ${tipo}.`);

    const request = await world.api();
    const sessionGuid = await autenticarIntelligenceApi(request);
    const resultado = await buscarPerfisIntelligence(request, payloadDaMassa(entrada), sessionGuid);

    expect(resultado.count.response.ok(), `count retornou ${resultado.count.response.status()}`).toBe(true);
    expect(resultado.list.response.ok(), `list retornou ${resultado.list.response.status()}`).toBe(true);

    const total = extrairContagem(resultado.count.body);
    const itens = extrairItens(resultado.list.body);
    expect(total).toBeGreaterThan(0);
    expect(itens.length).toBeGreaterThan(0);
    expect(total).toBeGreaterThanOrEqual(itens.length);
    expect(contemValor(itens, entrada.valor)).toBe(true);
  });
}

registrarCaso('API-POS-PAGINATION-01', async (world) => {
  const massa = await world.garantirMassa();
  const entrada = massa.buscas.cpf;
  if (!entrada) throw new Error('BLOQUEADO: não existe massa pesquisável por CPF.');

  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resultado = await buscarPerfisIntelligence(
    request,
    payloadDaMassa(entrada),
    sessionGuid,
    { first: 0, size: 1 },
  );

  expect(resultado.count.response.ok()).toBe(true);
  expect(resultado.list.response.ok()).toBe(true);
  expect(extrairItens(resultado.list.body).length).toBeLessThanOrEqual(1);
  expect(extrairContagem(resultado.count.body)).toBeGreaterThanOrEqual(
    extrairItens(resultado.list.body).length,
  );
});

registrarCaso('API-NEG-NOTFOUND-01', async (world) => {
  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resultado = await buscarPerfisIntelligence(request, semDado, sessionGuid);
  validarStatus(resultado, 200);
  expect(extrairContagem(resultado.count.body)).toBe(0);
  expect(extrairItens(resultado.list.body)).toHaveLength(0);
});

registrarCaso('API-NEG-COMMON-04', async (world) => {
  validarStatus(await buscarPerfisIntelligence(await world.api(), semDado), 401);
});

registrarCaso('API-NEG-COMMON-05', async (world) => {
  validarStatus(
    await buscarPerfisIntelligence(await world.api(), semDado, 'session-guid-invalido'),
    401,
  );
});

registrarCaso('API-NEG-COMMON-06', async (world) => {
  const massa = await world.garantirMassa();
  const entrada = ['cpf', 'EXTERNAL.ID', 'birthdate', 'name', 'cib']
    .map((tipo) => massa.buscas[tipo])
    .find((item) => item?.kind);
  if (!entrada) throw new Error('BLOQUEADO: nenhuma massa compativel com profile/list foi gerada.');

  const request = await world.api();
  const credenciais = await obterCredenciaisParaPerfilIntelligence(request, 'view-only');
  const sessionGuid = await autenticarIntelligenceApi(request, credenciais);
  validarStatus(await buscarPerfisIntelligence(request, payloadDaMassa(entrada), sessionGuid), 403);
});

for (const caso of [
  { id: 'API-NEG-PAYLOAD-NAME-01', payload: { value: '123', kind: 'KEY' } },
  { id: 'API-NEG-PAYLOAD-VALUE-01', payload: { name: 'cpf', value: '', kind: 'KEY' } },
  { id: 'API-NEG-PAYLOAD-KIND-01', payload: { name: 'cpf', value: '123', kind: 'INVALID_KIND' } },
]) {
  registrarCaso(caso.id, async (world: IntelligenceWorld) => {
    const request = await world.api();
    const sessionGuid = await autenticarIntelligenceApi(request);
    semExposicao(await buscarPerfisIntelligenceComPayloadLivre(request, caso.payload, sessionGuid));
  });
}

for (const caso of [
  { id: 'API-DES-SQLI-01', valor: "' OR '1'='1' --" },
  { id: 'API-DES-XSS-01', valor: '<script>alert(1)</script>' },
  { id: 'API-DES-PATH-01', valor: '../../../../etc/passwd' },
  { id: 'API-DES-OVERSIZE-01', valor: '9'.repeat(4096) },
]) {
  registrarCaso(caso.id, async (world: IntelligenceWorld) => {
    const request = await world.api();
    const sessionGuid = await autenticarIntelligenceApi(request);
    semExposicao(
      await buscarPerfisIntelligenceComPayloadLivre(
        request,
        { name: 'cpf', value: caso.valor, kind: 'KEY' },
        sessionGuid,
        { first: 0, size: 1 },
      ),
    );
  });
}

registrarCaso('API-NEG-PAGINATION-01', async (world) => {
  const massa = await world.garantirMassa();
  const entrada = massa.buscas.cpf;
  if (!entrada) throw new Error('BLOQUEADO: não existe massa pesquisável por CPF.');

  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resultado = await buscarPerfisIntelligence(
    request,
    payloadDaMassa(entrada),
    sessionGuid,
    { first: -1, size: 1 },
  );
  semErroInterno(resultado.count.response.status(), 'count');
  semErroInterno(resultado.list.response.status(), 'list');
  if (resultado.list.response.ok()) {
    expect(extrairItens(resultado.list.body).length).toBeLessThanOrEqual(1);
  }
});
