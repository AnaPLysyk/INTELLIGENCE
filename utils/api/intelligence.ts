import type { APIRequestContext } from '@playwright/test';

import type { EntradaMassaBusca } from '../data/intelligence';

export type CredenciaisIntelligenceApi = {
  usuario: string;
  senha: string;
};

export type PayloadBuscaIntelligence = {
  name: string;
  value: string;
  kind: string;
};

export type RespostaApiIntelligence = {
  response: {
    ok(): boolean;
    status(): number;
  };
  body: unknown;
};

export type ResultadoBuscaIntelligence = {
  count: RespostaApiIntelligence;
  list: RespostaApiIntelligence;
};

export type CampoBuscaIntelligence = {
  name: string;
  kind: string;
  type: string;
};

function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`CONFIGURACAO: informe ${nome} para executar os testes de API do Intelligence.`);
  return valor;
}

export function obterUrlApiIntelligence(): string {
  const configurada = process.env.INTELLIGENCE_API_URL?.trim();
  if (configurada) return configurada.replace(/\/$/, '');

  const ui = process.env.INTELLIGENCE_UI_URL?.trim();
  if (!ui) {
    throw new Error('CONFIGURACAO: informe INTELLIGENCE_API_URL ou INTELLIGENCE_UI_URL para executar os testes de API.');
  }
  const derivada = ui.replace(/\/$/, '').replace(/\/react$/i, '/service');
  if (derivada === ui.replace(/\/$/, '')) {
    throw new Error('CONFIGURACAO: nao foi possivel derivar a API de INTELLIGENCE_UI_URL; informe INTELLIGENCE_API_URL.');
  }
  return derivada;
}

async function lerBody(response: Response): Promise<unknown> {
  const texto = await response.text();
  if (!texto) return '';
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

function extrairToken(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('AUTOMATION ERROR: resposta de autenticacao do Intelligence nao e um objeto JSON.');
  }
  const raiz = body as Record<string, unknown>;
  const data = raiz.data && typeof raiz.data === 'object' && !Array.isArray(raiz.data)
    ? raiz.data as Record<string, unknown>
    : undefined;
  const token = raiz.token ?? raiz.access_token ?? data?.token ?? data?.access_token;
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('AUTOMATION ERROR: token nao encontrado na resposta de autenticacao do Intelligence.');
  }
  return token.trim();
}

function extrairSessionGuid(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('AUTOMATION ERROR: resposta de autenticacao do Intelligence nao e um objeto JSON.');
  }
  const raiz = body as Record<string, unknown>;
  const data = raiz.data && typeof raiz.data === 'object' && !Array.isArray(raiz.data)
    ? raiz.data as Record<string, unknown>
    : undefined;
  const sessionGuid = raiz['session-guid'] ?? raiz.sessionGuid ?? data?.['session-guid'] ?? data?.sessionGuid;
  if (typeof sessionGuid !== 'string' || !sessionGuid.trim()) {
    throw new Error('AUTOMATION ERROR: session-guid nao encontrado na resposta de autenticacao do Intelligence.');
  }
  return sessionGuid.trim();
}

function cabecalhos(sessionGuid?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (sessionGuid) headers['session-guid'] = sessionGuid;
  return headers;
}

export type SessaoIntelligenceApi = { sessionGuid: string; token: string };

export async function solicitarSessaoIntelligenceApi(
  request: APIRequestContext,
  payload: unknown,
): Promise<RespostaApiIntelligence> {
  void request;
  const response = await fetch(`${obterUrlApiIntelligence()}/session`, {
    method: 'POST',
    headers: cabecalhos(),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  return {
    response: {
      ok: () => response.ok,
      status: () => response.status,
    },
    body: await lerBody(response),
  };
}

export async function abrirSessaoIntelligenceApi(
  request: APIRequestContext,
  credenciais?: CredenciaisIntelligenceApi,
): Promise<SessaoIntelligenceApi> {
  const usuario = credenciais?.usuario || envObrigatoria('INTELLIGENCE_ADMIN_USERNAME');
  const senha = credenciais?.senha || envObrigatoria('INTELLIGENCE_ADMIN_PASSWORD');
  const resultado = await solicitarSessaoIntelligenceApi(request, { username: usuario, password: senha });
  if (resultado.response.status() !== 201) {
    throw new Error(`BLOQUEADO: autenticacao do Intelligence retornou HTTP ${resultado.response.status()}.`);
  }
  return { sessionGuid: extrairSessionGuid(resultado.body), token: extrairToken(resultado.body) };
}

export async function autenticarIntelligenceApi(
  request: APIRequestContext,
  credenciais?: CredenciaisIntelligenceApi,
): Promise<string> {
  return (await abrirSessaoIntelligenceApi(request, credenciais)).sessionGuid;
}

async function postarBusca(
  request: APIRequestContext,
  endpoint: string,
  payload: unknown,
  sessionGuid?: string,
): Promise<RespostaApiIntelligence> {
  void request;
  const response = await fetch(`${obterUrlApiIntelligence()}${endpoint}`, {
    method: 'POST',
    headers: cabecalhos(sessionGuid),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  return {
    response: {
      ok: () => response.ok,
      status: () => response.status,
    },
    body: await lerBody(response),
  };
}

async function obterJson(
  request: APIRequestContext,
  endpoint: string,
  sessionGuid?: string,
): Promise<RespostaApiIntelligence> {
  void request;
  const response = await fetch(`${obterUrlApiIntelligence()}${endpoint}`, {
    method: 'GET',
    headers: cabecalhos(sessionGuid),
    signal: AbortSignal.timeout(30_000),
  });
  return {
    response: {
      ok: () => response.ok,
      status: () => response.status,
    },
    body: await lerBody(response),
  };
}

export async function buscarPerfisIntelligence(
  request: APIRequestContext,
  payload: PayloadBuscaIntelligence,
  sessionGuid?: string,
  paginacao: { first: number; size: number } = { first: 0, size: 20 },
): Promise<ResultadoBuscaIntelligence> {
  const count = await postarBusca(request, '/profile/list/count', payload, sessionGuid);
  const list = await postarBusca(
    request,
    `/profile/list?first=${paginacao.first}&size=${paginacao.size}`,
    payload,
    sessionGuid,
  );
  return { count, list };
}

export async function buscarPerfisIntelligenceComPayloadLivre(
  request: APIRequestContext,
  payload: unknown,
  sessionGuid?: string,
  paginacao: { first: number; size: number } = { first: 0, size: 20 },
): Promise<ResultadoBuscaIntelligence> {
  const count = await postarBusca(request, '/profile/list/count', payload, sessionGuid);
  const list = await postarBusca(
    request,
    `/profile/list?first=${paginacao.first}&size=${paginacao.size}`,
    payload,
    sessionGuid,
  );
  return { count, list };
}

export async function listarCamposBuscaIntelligence(
  request: APIRequestContext,
  sessionGuid?: string,
): Promise<RespostaApiIntelligence> {
  return obterJson(request, '/fields/list', sessionGuid);
}

export async function obterDetalhesTransacaoIntelligence(
  request: APIRequestContext,
  tguid: string,
  sessionGuid?: string,
): Promise<RespostaApiIntelligence> {
  return obterJson(
    request,
    `/profile/transaction/${encodeURIComponent(tguid)}?fields=SUMMARY&image-format=PNG`,
    sessionGuid,
  );
}

export async function obterDetalhesPerfilIntelligence(
  request: APIRequestContext,
  pguid: string,
  sessionGuid?: string,
): Promise<RespostaApiIntelligence> {
  return obterJson(request, `/profile/person/${encodeURIComponent(pguid)}`, sessionGuid);
}

export function payloadDaMassa(entrada: EntradaMassaBusca): PayloadBuscaIntelligence {
  if (!entrada.kind) {
    throw new Error(`AUTOMATION ERROR: a massa de ${entrada.seletor} nao informa o kind da API.`);
  }
  return { name: entrada.seletor, value: entrada.valor, kind: entrada.kind };
}

export function extrairContagem(body: unknown): number {
  if (typeof body === 'number' && Number.isFinite(body)) return body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('AUTOMATION ERROR: resposta de count nao possui uma contagem reconhecivel.');
  }
  const objeto = body as Record<string, unknown>;
  for (const chave of ['count', 'total', 'totalElements', 'quantity']) {
    const valor = objeto[chave];
    if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  }
  for (const chave of ['data', 'result']) {
    if (objeto[chave] !== undefined) {
      try {
        return extrairContagem(objeto[chave]);
      } catch {
        // Continua procurando apenas em envelopes de resposta conhecidos.
      }
    }
  }
  throw new Error('AUTOMATION ERROR: resposta de count nao possui uma contagem reconhecivel.');
}

export function extrairItens(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') {
    throw new Error('AUTOMATION ERROR: resposta de list nao possui uma lista reconhecivel.');
  }
  const objeto = body as Record<string, unknown>;
  for (const chave of ['items', 'content', 'profiles', 'list', 'data', 'result']) {
    const valor = objeto[chave];
    if (Array.isArray(valor)) return valor;
    if (valor && typeof valor === 'object') {
      try {
        return extrairItens(valor);
      } catch {
        // Continua procurando apenas em envelopes de resposta conhecidos.
      }
    }
  }
  throw new Error('AUTOMATION ERROR: resposta de list nao possui uma lista reconhecivel.');
}

export function extrairCamposBusca(body: unknown): CampoBuscaIntelligence[] {
  if (Array.isArray(body)) {
    return body.map((item, indice) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`AUTOMATION ERROR: campo de busca ${indice} nao e um objeto.`);
      }
      const campo = item as Record<string, unknown>;
      if (typeof campo.name !== 'string' || typeof campo.kind !== 'string' || typeof campo.type !== 'string') {
        throw new Error(`AUTOMATION ERROR: campo de busca ${indice} nao possui name, kind e type.`);
      }
      return { name: campo.name, kind: campo.kind, type: campo.type };
    });
  }
  if (!body || typeof body !== 'object') {
    throw new Error('AUTOMATION ERROR: resposta de fields/list nao possui campos reconheciveis.');
  }
  const objeto = body as Record<string, unknown>;
  for (const chave of ['fields', 'data', 'result']) {
    if (objeto[chave] !== undefined) {
      try {
        return extrairCamposBusca(objeto[chave]);
      } catch {
        // Continua procurando apenas nos envelopes documentados.
      }
    }
  }
  throw new Error('AUTOMATION ERROR: resposta de fields/list nao possui campos reconheciveis.');
}

export function contemValor(body: unknown, esperado: string): boolean {
  if (typeof body === 'string' || typeof body === 'number') return String(body) === esperado;
  if (Array.isArray(body)) return body.some((item) => contemValor(item, esperado));
  if (!body || typeof body !== 'object') return false;
  return Object.values(body as Record<string, unknown>).some((item) => contemValor(item, esperado));
}
