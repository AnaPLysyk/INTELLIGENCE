import type { IntelligenceWorld } from '../../../cucumber/world';

export function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`BLOQUEADO: configure ${nome} com a massa especifica do ticket.`);
  return valor;
}

export async function autenticarAdmin(world: IntelligenceWorld) {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(world.credenciaisAdmin());
  return page;
}

export function idsCampos(detalhes: unknown, propriedade: 'keys' | 'biographics'): string[] {
  if (!detalhes || typeof detalhes !== 'object' || Array.isArray(detalhes)) return [];
  const raiz = detalhes as Record<string, unknown>;
  const data = raiz.data && typeof raiz.data === 'object' && !Array.isArray(raiz.data)
    ? raiz.data as Record<string, unknown>
    : raiz;
  const lista = data[propriedade];
  if (!Array.isArray(lista)) return [];

  return [...new Set(lista.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const id = (item as Record<string, unknown>).id;
    return typeof id === 'string' && id.trim() ? [id.trim()] : [];
  }))];
}
