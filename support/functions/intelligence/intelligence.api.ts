import type { APIRequestContext, APIResponse } from '@playwright/test';

import type { EntradaMassaBusca } from '../massa/massa-busca';

export type CredenciaisIntelligenceApi = {
  usuario: string;
  senha: string;
};

export type PayloadBuscaIntelligence = {
  name: string;
  value: string;
  kind: 'KEY' | 'BIOGRAPHIC' | 'EXTERNAL_ID';
};

export type RespostaApiIntelligence = {
  response: APIResponse;
  body: unknown;
};

export type ResultadoBuscaIntelligence = {
  count: RespostaApiIntelligence;
  list: RespostaApiIntelligence;
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

async function lerBody(response: APIResponse): Promise<unknown> {
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

function cabecalhos(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    const esquema = process.env.INTELLIGENCE_AUTH_SCHEME?.trim() || 'Bearer';
    headers.Authorization = esquema ? `${esquema} ${token}` : token;
  }
  return headers;
}

export async function autenticarIntelligenceApi(
  request: APIRequestContext,
  credenciais?: CredenciaisIntelligenceApi,
): Promise<string> {
  const usuario = credenciais?.usuario || envObrigatoria('INTELLIGENCE_ADMIN_USERNAME');
  const senha = credenciais?.senha || envObrigatoria('INTELLIGENCE_ADMIN_PASSWORD');
  const response = await request.post(`${obterUrlApiIntelligence()}/session`, {
    headers: cabecalhos(),
    data: { username: usuario, password: senha },
  });
  const body = await lerBody(response);
  if (response.status() !== 201) {
    throw new Error(`BLOQUEADO: autenticacao do Intelligence retornou HTTP ${response.status()}.`);
  }
  return extrairToken(body);
}

async function postarBusca(
  request: APIRequestContext,
  endpoint: string,
  payload: PayloadBuscaIntelligence,
  token?: string,
): Promise<RespostaApiIntelligence> {
  const response = await request.post(`${obterUrlApiIntelligence()}${endpoint}`, {
    headers: cabecalhos(token),
    data: payload,
  });
  return { response, body: await lerBody(response) };
}

export async function buscarPerfisIntelligence(
  request: APIRequestContext,
  payload: PayloadBuscaIntelligence,
  token?: string,
  paginacao: { first: number; size: number } = { first: 0, size: 20 },
): Promise<ResultadoBuscaIntelligence> {
  const count = await postarBusca(request, '/profile/list/count', payload, token);
  const list = await postarBusca(
    request,
    `/profile/list?first=${paginacao.first}&size=${paginacao.size}`,
    payload,
    token,
  );
  return { count, list };
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

export function contemValor(body: unknown, esperado: string): boolean {
  if (typeof body === 'string' || typeof body === 'number') return String(body) === esperado;
  if (Array.isArray(body)) return body.some((item) => contemValor(item, esperado));
  if (!body || typeof body !== 'object') return false;
  return Object.values(body as Record<string, unknown>).some((item) => contemValor(item, esperado));
}
