import fs from 'node:fs';
import path from 'node:path';

import type { APIRequestContext } from '@playwright/test';

import { autenticarGbds, consultarTransacaoGbds } from '../integrations/gbds';
import { autenticarSmart, consultarProcessoSmart } from '../integrations/smart';
import { consultarSmart } from '../database/smart';
import {
  autenticarIntelligenceApi,
  buscarPerfisIntelligence,
  contemValor,
  extrairContagem,
  extrairItens,
  payloadDaMassa,
} from '../api/intelligence';
import {
  caminhoArquivoMassa,
  type ArquivoMassaBusca,
  type EntradaMassaBusca,
  type IdentidadeEsperada,
} from '../data/intelligence';

type ProcessoIndexado = { ProcessId: number; Tguid: string; Pguid: string };
type CampoEncontrado = { nome: string; valor: string };

const ALIASES: Record<string, string[]> = {
  cpf: ['cpf', 'cpfcidadao'],
  name: ['nome', 'fullname', 'name'],
  birthdate: ['birthdate', 'birth_date', 'datanascimento', 'datadenascimento'],
  'EXTERNAL.ID': ['external.id', 'externalid', 'external_id', 'externalidentifier'],
  cib: ['cib', 'cib_exid', 'cibexid'],
};

function normalizar(nome: string): string {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]/gi, '').toLowerCase();
}

function coletarCampos(valor: unknown, campos: CampoEncontrado[], caminho = ''): void {
  if (Array.isArray(valor)) {
    for (const item of valor) coletarCampos(item, campos, caminho);
    return;
  }
  if (!valor || typeof valor !== 'object') return;

  const objeto = valor as Record<string, unknown>;
  const nomePar = objeto.id ?? objeto.key ?? objeto.name;
  const valorPar = objeto.value;
  if (typeof nomePar === 'string' && ['string', 'number'].includes(typeof valorPar)) {
    campos.push({ nome: nomePar, valor: String(valorPar).trim() });
  }
  if (String(objeto.type ?? '').toUpperCase() === 'EXTERNAL_ID' && ['string', 'number'].includes(typeof valorPar)) {
    campos.push({ nome: 'EXTERNAL.ID', valor: String(valorPar).trim() });
  }

  for (const [nome, item] of Object.entries(objeto)) {
    const proximoCaminho = caminho ? `${caminho}.${nome}` : nome;
    if (['string', 'number'].includes(typeof item) && String(item).trim()) {
      campos.push({ nome, valor: String(item).trim() });
      campos.push({ nome: proximoCaminho, valor: String(item).trim() });
    } else {
      coletarCampos(item, campos, proximoCaminho);
    }
  }
}

function encontrar(campos: CampoEncontrado[], tipo: string): string | undefined {
  const aliases = (ALIASES[tipo] ?? [tipo]).map(normalizar);
  for (const alias of aliases) {
    const campo = campos.find((item) => normalizar(item.nome) === alias);
    if (campo) return campo.valor;
  }
  return undefined;
}

function entrada(
  seletor: string,
  valor: string,
  esperado: IdentidadeEsperada,
  kind: EntradaMassaBusca['kind'],
  origem: EntradaMassaBusca['origem'],
): EntradaMassaBusca {
  return { seletor, valor, kind, origem, esperado };
}

async function estaPesquisavelNoIntelligence(
  request: APIRequestContext,
  item: EntradaMassaBusca,
  sessionGuid: string,
): Promise<boolean> {
  const resultado = await buscarPerfisIntelligence(request, payloadDaMassa(item), sessionGuid, { first: 0, size: 5 });
  const statusCount = resultado.count.response.status();
  const statusList = resultado.list.response.status();
  if (statusCount === 401 || statusList === 401) {
    throw new Error('BLOQUEADO: a sessao administrativa do Intelligence foi rejeitada durante a descoberta da massa.');
  }
  if (!resultado.count.response.ok() || !resultado.list.response.ok()) {
    throw new Error(`BLOQUEADO: o pre-flight da massa retornou HTTP count=${statusCount}, list=${statusList}.`);
  }

  const itens = extrairItens(resultado.list.body);
  const quantidade = extrairContagem(resultado.count.body);
  if (quantidade <= 0 || itens.length === 0) return false;

  const identidadesEsperadas = [item.esperado.pguid, item.esperado.tguid]
    .map((valor) => String(valor || '').trim())
    .filter(Boolean);
  return identidadesEsperadas.some((valor) => contemValor(itens, valor)) || contemValor(itens, item.valor);
}

export async function gerarMassaDeBuscaComDadosDoSmart(request: APIRequestContext): Promise<ArquivoMassaBusca> {
  const limite = Number(process.env.SMART_MASSA_LIMITE_CANDIDATOS?.trim() || '30');
  if (!Number.isInteger(limite) || limite <= 0 || limite > 200) {
    throw new Error('CONFIGURACAO: SMART_MASSA_LIMITE_CANDIDATOS deve estar entre 1 e 200.');
  }

  const processos = await consultarSmart<ProcessoIndexado>(
    `SELECT ProcessId, Tguid, Pguid FROM Process
       WHERE Tguid IS NOT NULL AND Tguid <> '' AND Pguid IS NOT NULL AND Pguid <> ''
       ORDER BY ProcessId DESC LIMIT ${limite}`,
  );
  if (processos.length === 0) throw new Error('BLOQUEADO: nenhum processo SMART com TGUID e PGUID foi encontrado.');

  const token = await autenticarSmart(request);
  const tokenGbds = await autenticarGbds();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const buscas: Record<string, EntradaMassaBusca> = {};
  const tiposAlvo = (process.env.INTELLIGENCE_MASSA_TIPOS || 'PGUID,TGUID,EXTERNAL.ID,cpf,birthdate,name,cib')
    .split(',').map((tipo) => tipo.trim()).filter(Boolean);
  const tiposObrigatorios = (process.env.INTELLIGENCE_MASSA_TIPOS_OBRIGATORIOS || 'PGUID,TGUID,cpf')
    .split(',').map((tipo) => tipo.trim()).filter(Boolean);
  const concorrencia = Number(process.env.SMART_MASSA_CONCORRENCIA?.trim() || '5');
  if (!Number.isInteger(concorrencia) || concorrencia < 1 || concorrencia > 10) {
    throw new Error('CONFIGURACAO: SMART_MASSA_CONCORRENCIA deve estar entre 1 e 10.');
  }

  for (let inicio = 0; inicio < processos.length; inicio += concorrencia) {
    const lote = processos.slice(inicio, inicio + concorrencia);
    const resultados = await Promise.all(lote.map(async (processo) => {
      const detalhes = await consultarProcessoSmart(request, token, processo.ProcessId);
      const campos: CampoEncontrado[] = [];
      coletarCampos(detalhes, campos);
      if (!encontrar(campos, 'EXTERNAL.ID') || !encontrar(campos, 'cib')) {
        coletarCampos(await consultarTransacaoGbds(tokenGbds, String(processo.Tguid)), campos);
      }
      return { processo, campos };
    }));

    const candidatas: Array<{ tipo: string; item: EntradaMassaBusca }> = [];
    for (const { processo, campos } of resultados) {
      const esperado: IdentidadeEsperada = {
        processId: Number(processo.ProcessId),
        pguid: String(processo.Pguid),
        tguid: String(processo.Tguid),
        nome: encontrar(campos, 'name'),
        cpf: encontrar(campos, 'cpf'),
        dataNascimento: encontrar(campos, 'birthdate'),
        externalId: encontrar(campos, 'EXTERNAL.ID'),
      };
      buscas.PGUID ??= entrada('PGUID', esperado.pguid, esperado, undefined, 'SMART.Process');
      buscas.TGUID ??= entrada('TGUID', esperado.tguid, esperado, undefined, 'SMART.Process');
      if (!buscas.cpf && esperado.cpf) candidatas.push({ tipo: 'cpf', item: entrada('cpf', esperado.cpf, esperado, 'KEY', 'SMART API') });
      if (!buscas.name && esperado.nome) candidatas.push({ tipo: 'name', item: entrada('name', esperado.nome, esperado, 'BIOGRAPHIC', 'SMART API') });
      if (!buscas.birthdate && esperado.dataNascimento) candidatas.push({ tipo: 'birthdate', item: entrada('birthdate', esperado.dataNascimento, esperado, 'BIOGRAPHIC', 'SMART API') });
      if (!buscas['EXTERNAL.ID'] && esperado.externalId) candidatas.push({ tipo: 'EXTERNAL.ID', item: entrada('EXTERNAL.ID', esperado.externalId, esperado, 'EXTERNAL_ID', 'GBDS API') });
      const cib = encontrar(campos, 'cib');
      if (!buscas.cib && cib) candidatas.push({ tipo: 'cib', item: entrada('cib', cib, esperado, 'KEY', 'GBDS API') });
    }

    const validacoes = await Promise.all(candidatas.map(async ({ tipo, item }) => ({
      tipo,
      item,
      disponivel: await estaPesquisavelNoIntelligence(request, item, sessionGuid),
    })));
    for (const validacao of validacoes) if (validacao.disponivel) buscas[validacao.tipo] ??= validacao.item;
    if (tiposAlvo.every((tipo) => buscas[tipo])) break;
  }

  const caminhoFixture = path.resolve(__dirname, '../test-data/fixtures/busca-massa-adicional.json');
  if (fs.existsSync(caminhoFixture)) {
    const fixture = JSON.parse(fs.readFileSync(caminhoFixture, 'utf8'));
    for (const [tipo, item] of Object.entries(fixture.buscas || {})) {
      if (!buscas[tipo]) buscas[tipo] = item as EntradaMassaBusca;
    }
  }

  const tiposAusentes = tiposAlvo.filter((tipo) => !buscas[tipo]);
  const obrigatoriosAusentes = tiposObrigatorios.filter((tipo) => !buscas[tipo]);
  if (obrigatoriosAusentes.length > 0) {
    throw new Error(`BLOQUEADO: o SMART nao forneceu a massa central para: ${obrigatoriosAusentes.join(', ')}`);
  }

  const arquivo: ArquivoMassaBusca = {
    schemaVersion: 1,
    geradoEm: new Date().toISOString(),
    fonte: 'SMART_API_BD_E_GBDS_SOMENTE_LEITURA',
    buscas,
    tiposAusentes,
  };
  const destino = caminhoArquivoMassa();
  const temporario = `${destino}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(temporario, `${JSON.stringify(arquivo, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporario, destino);
  return arquivo;
}
