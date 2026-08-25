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
  extrairCamposBusca,
  extrairContagem,
  extrairItens,
  listarCamposBuscaIntelligence,
  obterDetalhesPerfilIntelligence,
  payloadDaMassa,
  type CampoBuscaIntelligence,
} from '../api/intelligence';
import {
  caminhoArquivoMassa,
  type ArquivoMassaBusca,
  type EntradaMassaBusca,
  type IdentidadeEsperada,
} from '../data/intelligence';

type ProcessoIndexado = { ProcessId: number; Tguid: string; Pguid: string };
type CampoEncontrado = { nome: string; valor: string };
type Candidata = { tipo: string; item: EntradaMassaBusca };
type EscopoMassa = {
  tiposAlvo: string[];
  tiposObrigatorios: string[];
  tiposDescoberta: Set<string>;
};

const ALIASES: Record<string, string[]> = {
  cpf: ['cpf', 'cpfcidadao'],
  name: ['nome', 'fullname', 'name'],
  birthdate: ['birthdate', 'birth_date', 'datanascimento', 'datadenascimento', 'data de nascimento'],
  'EXTERNAL.ID': ['external.id', 'externalid', 'external_id', 'externalidentifier', 'external id'],
  cib: ['cib', 'cib_exid', 'cibexid'],
};

const MASSA_POR_CASE_ID: Record<string, string[]> = {
  'API-POS-CPF-01': ['cpf'],
  'API-POS-EXTERNAL-01': ['EXTERNAL.ID'],
  'API-POS-BIRTHDATE-01': ['birthdate'],
  'API-POS-NAME-01': ['name'],
  'API-POS-CIB-01': ['cib'],
  'API-POS-PAGINATION-01': ['cpf'],
  'API-NEG-PAGINATION-01': ['cpf'],
  'API-NEG-COMMON-06': ['cpf'],
  'API-POS-PROFILE-VIEWONLY-01': ['PGUID'],
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

function resolverCampoCatalogo(
  catalogo: CampoBuscaIntelligence[],
  tipo: string,
): CampoBuscaIntelligence | undefined {
  const aliases = new Set((ALIASES[tipo] ?? [tipo]).map(normalizar));
  return catalogo.find((campo) => aliases.has(normalizar(campo.name)));
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

function entradaDoCatalogo(
  catalogo: CampoBuscaIntelligence[],
  tipo: string,
  valor: string,
  esperado: IdentidadeEsperada,
  origem: EntradaMassaBusca['origem'],
): EntradaMassaBusca | undefined {
  const campo = resolverCampoCatalogo(catalogo, tipo);
  if (!campo) return undefined;
  return entrada(campo.name, valor, esperado, campo.kind, origem);
}

function variacoesValor(tipo: string, valor: string): string[] {
  const valores = new Set([valor.trim()]);
  if (tipo === 'birthdate') {
    const br = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) valores.add(`${br[3]}-${br[2]}-${br[1]}`);
    const iso = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (iso) valores.add(`${iso[3]}/${iso[2]}/${iso[1]}`);
  }
  return [...valores].filter(Boolean);
}

function listaEnv(nome: string, padrao: string): string[] {
  return (process.env[nome] || padrao)
    .split(',')
    .map((tipo) => tipo.trim())
    .filter(Boolean);
}

function escopoMassaDaExecucao(): EscopoMassa {
  const caseId = process.env.QA_CASE_ID?.trim();
  const tiposFiltrados = caseId ? MASSA_POR_CASE_ID[caseId] : undefined;
  const tiposAlvo = tiposFiltrados
    ? [...tiposFiltrados]
    : listaEnv('INTELLIGENCE_MASSA_TIPOS', 'PGUID,TGUID,EXTERNAL.ID,cpf,birthdate,name,cib');
  const tiposObrigatorios = tiposFiltrados
    ? [...tiposFiltrados]
    : listaEnv('INTELLIGENCE_MASSA_TIPOS_OBRIGATORIOS', 'PGUID,TGUID,cpf');
  const tiposDescoberta = new Set(
    tiposAlvo.filter((tipo) => !['PGUID', 'TGUID'].includes(tipo)),
  );

  if ([...tiposDescoberta].some((tipo) => ['name', 'birthdate', 'cib'].includes(tipo))) {
    tiposDescoberta.add('cpf');
  }

  if (caseId && tiposFiltrados) {
    console.log(`[massa] escopo filtrado: caseId=${caseId}|alvos=${tiposAlvo.join(',')}`);
  }

  return { tiposAlvo, tiposObrigatorios, tiposDescoberta };
}

async function carregarCatalogoBusca(
  request: APIRequestContext,
  sessionGuid: string,
): Promise<CampoBuscaIntelligence[]> {
  const resposta = await listarCamposBuscaIntelligence(request, sessionGuid);
  if (resposta.response.status() !== 200) {
    throw new Error(`BLOQUEADO: fields/list retornou HTTP ${resposta.response.status()} durante descoberta da massa.`);
  }
  const catalogo = extrairCamposBusca(resposta.body);
  console.log(`[massa] catalogo carregado: campos=${catalogo.length}`);
  for (const tipo of ['cpf', 'name', 'birthdate', 'EXTERNAL.ID', 'cib']) {
    const campo = resolverCampoCatalogo(catalogo, tipo);
    console.log(
      campo
        ? `[massa] catalogo resolve: tipo=${tipo}|name=${campo.name}|kind=${campo.kind}|type=${campo.type}`
        : `[massa] catalogo sem campo: tipo=${tipo}`,
    );
  }
  return catalogo;
}

function chaveCandidata(candidata: Candidata): string {
  return [
    candidata.tipo,
    candidata.item.seletor,
    candidata.item.kind || '',
    candidata.item.valor,
  ].join('|');
}

function nomeErro(error_: unknown): string {
  if (error_ instanceof Error) return error_.name || 'Error';
  return typeof error_;
}

async function validarCandidata(
  request: APIRequestContext,
  candidata: Candidata,
  sessionGuid: string,
): Promise<{ disponivel: boolean; itens: unknown[] }> {
  let resultado: Awaited<ReturnType<typeof buscarPerfisIntelligence>>;
  try {
    resultado = await buscarPerfisIntelligence(
      request,
      payloadDaMassa(candidata.item),
      sessionGuid,
      { first: 0, size: 5 },
    );
  } catch (error_) {
    console.log(
      `[massa] preflight indisponivel: tipo=${candidata.tipo}|origem=${candidata.item.origem}`
      + `|name=${candidata.item.seletor}|kind=${candidata.item.kind}|erro=${nomeErro(error_)}`,
    );
    return { disponivel: false, itens: [] };
  }

  const statusCount = resultado.count.response.status();
  const statusList = resultado.list.response.status();

  if (statusCount === 401 || statusList === 401) {
    throw new Error('BLOQUEADO: a sessao administrativa do Intelligence foi rejeitada durante a descoberta da massa.');
  }

  if (!resultado.count.response.ok() || !resultado.list.response.ok()) {
    console.log(
      `[massa] preflight rejeitado: tipo=${candidata.tipo}|origem=${candidata.item.origem}`
      + `|name=${candidata.item.seletor}|kind=${candidata.item.kind}|countHttp=${statusCount}|listHttp=${statusList}`,
    );
    return { disponivel: false, itens: [] };
  }

  const itens = extrairItens(resultado.list.body);
  const quantidade = extrairContagem(resultado.count.body);
  const identidadesEsperadas = [candidata.item.esperado.pguid, candidata.item.esperado.tguid]
    .map((valor) => String(valor || '').trim())
    .filter(Boolean);
  const corresponde = identidadesEsperadas.some((valor) => contemValor(itens, valor))
    || contemValor(itens, candidata.item.valor);
  const disponivel = quantidade > 0 && itens.length > 0 && corresponde;

  console.log(
    `[massa] preflight: tipo=${candidata.tipo}|origem=${candidata.item.origem}`
    + `|name=${candidata.item.seletor}|kind=${candidata.item.kind}`
    + `|countHttp=${statusCount}|listHttp=${statusList}|count=${quantidade}|items=${itens.length}|match=${corresponde}`,
  );

  return { disponivel, itens };
}

function candidatasDeCampos(
  catalogo: CampoBuscaIntelligence[],
  campos: CampoEncontrado[],
  esperado: IdentidadeEsperada,
  origem: EntradaMassaBusca['origem'],
  tiposPermitidos: Set<string>,
): Candidata[] {
  const candidatas: Candidata[] = [];
  for (const tipo of ['cpf', 'name', 'birthdate', 'EXTERNAL.ID', 'cib']) {
    if (!tiposPermitidos.has(tipo)) continue;
    const valor = encontrar(campos, tipo);
    if (!valor) continue;
    for (const variacao of variacoesValor(tipo, valor)) {
      const item = entradaDoCatalogo(catalogo, tipo, variacao, esperado, origem);
      if (item) candidatas.push({ tipo, item });
    }
  }
  return candidatas;
}

async function candidatasDoPerfilIntelligence(
  request: APIRequestContext,
  sessionGuid: string,
  catalogo: CampoBuscaIntelligence[],
  processo: ProcessoIndexado,
  tiposPermitidos: Set<string>,
): Promise<Candidata[]> {
  let resposta: Awaited<ReturnType<typeof obterDetalhesPerfilIntelligence>>;
  try {
    resposta = await obterDetalhesPerfilIntelligence(request, String(processo.Pguid), sessionGuid);
  } catch (error_) {
    console.log(`[massa] profile/person indisponivel durante descoberta|erro=${nomeErro(error_)}`);
    return [];
  }
  if (resposta.response.status() !== 200) return [];

  const campos: CampoEncontrado[] = [];
  coletarCampos(resposta.body, campos);
  const esperado: IdentidadeEsperada = {
    processId: Number(processo.ProcessId),
    pguid: String(processo.Pguid),
    tguid: String(processo.Tguid),
    nome: encontrar(campos, 'name'),
    cpf: encontrar(campos, 'cpf'),
    dataNascimento: encontrar(campos, 'birthdate'),
    externalId: encontrar(campos, 'EXTERNAL.ID'),
  };
  return candidatasDeCampos(catalogo, campos, esperado, 'INTELLIGENCE API', tiposPermitidos);
}

function candidatasDosResultadosCpf(
  catalogo: CampoBuscaIntelligence[],
  itens: unknown[],
  esperado: IdentidadeEsperada,
  tiposPermitidos: Set<string>,
): Candidata[] {
  const campos: CampoEncontrado[] = [];
  coletarCampos(itens, campos);
  return candidatasDeCampos(catalogo, campos, esperado, 'INTELLIGENCE API', tiposPermitidos);
}

async function aplicarCandidatas(
  request: APIRequestContext,
  candidatas: Candidata[],
  sessionGuid: string,
  catalogo: CampoBuscaIntelligence[],
  buscas: Record<string, EntradaMassaBusca>,
  tentadas: Set<string>,
  tiposPermitidos: Set<string>,
): Promise<void> {
  for (const candidata of candidatas) {
    if (!tiposPermitidos.has(candidata.tipo) || buscas[candidata.tipo]) continue;
    const chave = chaveCandidata(candidata);
    if (tentadas.has(chave)) continue;
    tentadas.add(chave);

    const resultado = await validarCandidata(request, candidata, sessionGuid);
    if (!resultado.disponivel) continue;
    buscas[candidata.tipo] = candidata.item;
    console.log(
      `[massa] candidata validada: tipo=${candidata.tipo}|origem=${candidata.item.origem}`
      + `|name=${candidata.item.seletor}|kind=${candidata.item.kind}`,
    );

    if (candidata.tipo === 'cpf') {
      const derivadas = candidatasDosResultadosCpf(
        catalogo,
        resultado.itens,
        candidata.item.esperado,
        tiposPermitidos,
      );
      await aplicarCandidatas(
        request,
        derivadas,
        sessionGuid,
        catalogo,
        buscas,
        tentadas,
        tiposPermitidos,
      );
    }
  }
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
  const catalogo = await carregarCatalogoBusca(request, sessionGuid);
  const { tiposAlvo, tiposObrigatorios, tiposDescoberta } = escopoMassaDaExecucao();
  const buscas: Record<string, EntradaMassaBusca> = {};
  const tentadas = new Set<string>();
  const concorrencia = Number(process.env.SMART_MASSA_CONCORRENCIA?.trim() || '5');
  if (!Number.isInteger(concorrencia) || concorrencia < 1 || concorrencia > 10) {
    throw new Error('CONFIGURACAO: SMART_MASSA_CONCORRENCIA deve estar entre 1 e 10.');
  }

  for (let inicio = 0; inicio < processos.length; inicio += concorrencia) {
    const lote = processos.slice(inicio, inicio + concorrencia);
    const resultados = await Promise.all(lote.map(async (processo) => {
      const campos: CampoEncontrado[] = [];
      try {
        coletarCampos(await consultarProcessoSmart(request, token, processo.ProcessId), campos);
      } catch (error_) {
        console.log(`[massa] SMART API indisponivel para candidato|erro=${nomeErro(error_)}`);
      }
      if (!encontrar(campos, 'EXTERNAL.ID') || !encontrar(campos, 'cib')) {
        try {
          coletarCampos(await consultarTransacaoGbds(tokenGbds, String(processo.Tguid)), campos);
        } catch (error_) {
          console.log(`[massa] GBDS API indisponivel para candidato|erro=${nomeErro(error_)}`);
        }
      }
      return { processo, campos };
    }));

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

      if (tiposAlvo.includes('PGUID')) {
        buscas.PGUID ??= entrada('PGUID', esperado.pguid, esperado, undefined, 'SMART.Process');
      }
      if (tiposAlvo.includes('TGUID')) {
        buscas.TGUID ??= entrada('TGUID', esperado.tguid, esperado, undefined, 'SMART.Process');
      }

      await aplicarCandidatas(
        request,
        candidatasDeCampos(catalogo, campos, esperado, 'SMART API', tiposDescoberta),
        sessionGuid,
        catalogo,
        buscas,
        tentadas,
        tiposDescoberta,
      );
      await aplicarCandidatas(
        request,
        await candidatasDoPerfilIntelligence(
          request,
          sessionGuid,
          catalogo,
          processo,
          tiposDescoberta,
        ),
        sessionGuid,
        catalogo,
        buscas,
        tentadas,
        tiposDescoberta,
      );
    }

    if (tiposAlvo.every((tipo) => buscas[tipo])) break;
  }

  const tiposAusentes = tiposAlvo.filter((tipo) => !buscas[tipo]);
  const obrigatoriosAusentes = tiposObrigatorios.filter((tipo) => !buscas[tipo]);
  if (obrigatoriosAusentes.length > 0) {
    throw new Error(`BLOQUEADO: o ambiente nao forneceu massa pesquisavel para: ${obrigatoriosAusentes.join(', ')}`);
  }

  const arquivo: ArquivoMassaBusca = {
    schemaVersion: 1,
    geradoEm: new Date().toISOString(),
    fonte: 'SMART_API_BD_GBDS_INTELLIGENCE_SOMENTE_LEITURA',
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
