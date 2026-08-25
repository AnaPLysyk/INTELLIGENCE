const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig;

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

function coletarPguids(valor: unknown, encontrados: Set<string>): void {
  if (typeof valor === 'string') {
    const matches = valor.match(UUID) ?? [];
    for (const match of matches) encontrados.add(match.toUpperCase());
    UUID.lastIndex = 0;
    return;
  }

  if (Array.isArray(valor)) {
    for (const item of valor) coletarPguids(item, encontrados);
    return;
  }

  if (!valor || typeof valor !== 'object') return;
  for (const item of Object.values(valor as Record<string, unknown>)) {
    coletarPguids(item, encontrados);
  }
}

export function extrairPguidsPreviousHistory(body: unknown): string[] {
  const previousHistory = localizarPreviousHistory(body);
  if (previousHistory === undefined || previousHistory === null) return [];

  const encontrados = new Set<string>();
  coletarPguids(previousHistory, encontrados);
  return [...encontrados];
}
