import { expect } from '@playwright/test';

import type { IntelligenceWorld } from '../../../../cucumber/world';
import {
  autenticarIntelligenceApi,
  buscarPerfisIntelligence,
  contemValor,
  extrairCamposBusca,
  extrairContagem,
  extrairItens,
  listarCamposBuscaIntelligence,
  obterDetalhesPerfilIntelligence,
  obterDetalhesTransacaoIntelligence,
  payloadDaMassa,
} from '../../../../utils/api/intelligence';
import { obterCredenciaisParaPerfilIntelligence } from '../../../../utils/auth/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';

const buscas = [
  ['API-POS-CPF-01', 'cpf'],
  ['API-POS-EXTERNAL-01', 'EXTERNAL.ID'],
  ['API-POS-BIRTHDATE-01', 'birthdate'],
  ['API-POS-NAME-01', 'name'],
  ['API-POS-CIB-01', 'cib'],
] as const;

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

registrarCaso('API-POS-FIELDS-01', async (world) => {
  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resposta = await listarCamposBuscaIntelligence(request, sessionGuid);
  expect(resposta.response.status()).toBe(200);
  const campos = extrairCamposBusca(resposta.body);
  expect(campos.length).toBeGreaterThan(0);
  expect(new Set(campos.map((campo) => campo.name.toLowerCase())).size).toBe(campos.length);
});

registrarCaso('API-POS-PAGINATION-01', async (world) => {
  const massa = await world.garantirMassa();
  const entrada = massa.buscas.cpf;
  if (!entrada) throw new Error('BLOQUEADO: não existe massa pesquisável por CPF.');
  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resultado = await buscarPerfisIntelligence(request, payloadDaMassa(entrada), sessionGuid, { first: 0, size: 1 });
  expect(resultado.count.response.ok()).toBe(true);
  expect(resultado.list.response.ok()).toBe(true);
  expect(extrairItens(resultado.list.body).length).toBeLessThanOrEqual(1);
  expect(extrairContagem(resultado.count.body)).toBeGreaterThanOrEqual(extrairItens(resultado.list.body).length);
});

registrarCaso('API-POS-TGUID-01', async (world) => {
  await world.garantirMassa();
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resposta = await obterDetalhesTransacaoIntelligence(request, tguid, sessionGuid);
  expect(resposta.response.status()).toBe(200);
  expect(contemValor(resposta.body, tguid)).toBe(true);
});

registrarCaso('API-POS-PROFILE-VIEWONLY-01', async (world) => {
  await world.garantirMassa();
  const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);
  const request = await world.api();
  const credenciais = await obterCredenciaisParaPerfilIntelligence(request, 'view-only');
  const sessionGuid = await autenticarIntelligenceApi(request, credenciais);
  const resposta = await obterDetalhesPerfilIntelligence(request, pguid, sessionGuid);
  expect(resposta.response.status(), 'O backend deve carregar o perfil solicitado para o usuario view-only.').toBe(200);
});
