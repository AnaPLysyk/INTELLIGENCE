const UUID_EXATO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_GLOBAL = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig;

function localizarPreviousHistory(valor: unknown, visitados = new Set<object>()): unknown | undefined {
  if (!valor || typeof valor !== 'object') return undefined;
  if (visitados.has(valor as object)) return undefined;
  visitados.add(valor as object);

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const encontrado = localizarPreviousHistory(item, visitados);
      if (encontrado !== undefined) return encontrado;
    }
    return undefined;
  }

  const objeto = valor as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(objeto, 'previousHistory')) {
    return objeto.previousHistory;
  }

  for (const item of Object.values(objeto)) {
    const encontrado = localizarPreviousHistory(item, visitados);
    if (encontrado !== undefined) return encontrado;
  }
  return undefined;
}

function adicionarUuids(valor: unknown, encontrados: Set<string>): void {
  if (typeof valor !== 'string') return;
  for (const match of valor.match(UUID_GLOBAL) ?? []) {
    encontrados.add(match.toUpperCase());
  }
}

function coletarPguidsNomeados(valor: unknown, encontrados: Set<string>): void {
  if (Array.isArray(valor)) {
    for (const item of valor) coletarPguidsNomeados(item, encontrados);
    return;
  }
  if (!valor || typeof valor !== 'object') return;

  for (const [chave, item] of Object.entries(valor as Record<string, unknown>)) {
    const chaveNormalizada = chave.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (chaveNormalizada.includes('pguid') || chaveNormalizada === 'profileguid') {
      adicionarUuids(item, encontrados);
    }
    if (UUID_EXATO.test(chave)) encontrados.add(chave.toUpperCase());
    coletarPguidsNomeados(item, encontrados);
  }
}

function coletarUuidsFallback(valor: unknown, encontrados: Set<string>): void {
  if (typeof valor === 'string') {
    adicionarUuids(valor, encontrados);
    return;
  }
  if (Array.isArray(valor)) {
    for (const item of valor) coletarUuidsFallback(item, encontrados);
    return;
  }
  if (!valor || typeof valor !== 'object') return;

  for (const [chave, item] of Object.entries(valor as Record<string, unknown>)) {
    if (UUID_EXATO.test(chave)) encontrados.add(chave.toUpperCase());
    coletarUuidsFallback(item, encontrados);
  }
}

export function extrairPguidsPreviousHistory(body: unknown): string[] {
  const previousHistory = localizarPreviousHistory(body);
  if (previousHistory === undefined || previousHistory === null) return [];

  const pguidsNomeados = new Set<string>();
  coletarPguidsNomeados(previousHistory, pguidsNomeados);
  if (pguidsNomeados.size > 0) return [...pguidsNomeados];

  // Compatibilidade defensiva com versões antigas em que previousHistory
  // não identifica explicitamente o campo PGUID no JSON.
  const fallback = new Set<string>();
  coletarUuidsFallback(previousHistory, fallback);
  return [...fallback];
}
