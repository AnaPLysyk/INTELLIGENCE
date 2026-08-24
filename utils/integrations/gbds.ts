function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`CONFIGURACAO: informe ${nome} para consultar o GBDS.`);
  return valor;
}

function baseUrlGbds(): string {
  return envObrigatoria('GBDS_API_BASE_URL').replace(/\/$/, '');
}

async function lerBody(response: Response): Promise<unknown> {
  const texto = await response.text();
  if (!texto) return '';
  try { return JSON.parse(texto); } catch { return texto; }
}

function extrairToken(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('AUTOMATION ERROR: resposta de autenticacao GBDS invalida.');
  }
  const raiz = body as Record<string, unknown>;
  const data = raiz.data && typeof raiz.data === 'object' && !Array.isArray(raiz.data)
    ? raiz.data as Record<string, unknown>
    : undefined;
  const token = raiz.token ?? raiz.access_token ?? data?.token ?? data?.access_token;
  if (typeof token !== 'string' || !token) throw new Error('AUTOMATION ERROR: token GBDS ausente.');
  return token;
}

export async function autenticarGbds(): Promise<string> {
  const response = await fetch(`${baseUrlGbds()}/gbds/v2/tokens`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: {
      grantType: 'CREDENTIALS',
      userName: envObrigatoria('GBDS_USERNAME'),
      userPassword: envObrigatoria('GBDS_PASSWORD'),
      token: null,
    } }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await lerBody(response);
  if (response.status !== 201) throw new Error(`BLOQUEADO: autenticacao GBDS retornou HTTP ${response.status}.`);
  return extrairToken(body);
}

export async function consultarTransacaoGbds(token: string, tguid: string): Promise<unknown> {
  const response = await fetch(
    `${baseUrlGbds()}/gbds/v2/people/transactions/${encodeURIComponent(tguid)}`,
    {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  const body = await lerBody(response);
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`BLOQUEADO: consulta GBDS da transacao retornou HTTP ${response.status}.`);
  return body;
}

