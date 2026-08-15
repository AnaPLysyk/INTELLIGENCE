import type { APIRequestContext } from '@playwright/test';

function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`CONFIGURACAO: informe ${nome} para acessar a API SMART.`);
  return valor;
}

function baseUrlSmart(): string {
  const url = envObrigatoria('SMART_API_BASE_URL').replace(/\/$/, '').replace(/\/react$/i, '');
  return url;
}

function extrairToken(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('AUTOMATION ERROR: resposta de autenticacao SMART nao e um objeto JSON.');
  }
  const raiz = body as Record<string, unknown>;
  const data = raiz.data && typeof raiz.data === 'object' ? raiz.data as Record<string, unknown> : undefined;
  const dataInterna = data?.data && typeof data.data === 'object' ? data.data as Record<string, unknown> : undefined;
  const token = raiz.access_token ?? raiz.token ?? data?.access_token ?? data?.token ?? dataInterna?.access_token ?? dataInterna?.token;
  if (!token) throw new Error('AUTOMATION ERROR: token nao encontrado na resposta do SMART.');
  return String(token);
}

async function lerBody(response: Response): Promise<unknown> {
  const texto = await response.text();
  if (!texto) return '';
  try { return JSON.parse(texto); } catch { return texto; }
}

function autorizacao(token: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  };
}

export async function autenticarSmart(request: APIRequestContext): Promise<string> {
  void request;
  const response = await fetch(`${baseUrlSmart()}/api/tokens`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        grantType: 'CREDENTIALS',
        userName: envObrigatoria('SMART_UI_USERNAME'),
        userPassword: envObrigatoria('SMART_UI_PASSWORD'),
        token: null,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await lerBody(response);
  if (!response.ok) {
    throw new Error(`BLOQUEADO: autenticacao SMART retornou HTTP ${response.status}.`);
  }
  return extrairToken(body);
}

export async function consultarProcessoSmart(
  request: APIRequestContext,
  token: string,
  processId: number,
): Promise<unknown> {
  void request;
  const response = await fetch(`${baseUrlSmart()}/api/processos/${processId}`, {
    headers: autorizacao(token),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await lerBody(response);
  if (!response.ok) throw new Error(`BLOQUEADO: consulta SMART do processo ${processId} retornou HTTP ${response.status}.`);
  return body;
}
