import type { IntelligenceWorld } from '../../cucumber/world';

export type CasoAutomatizado = (world: IntelligenceWorld) => Promise<void>;

const casos = new Map<string, CasoAutomatizado>();

export function registrarCaso(id: string, executar: CasoAutomatizado): void {
  if (casos.has(id)) throw new Error(`AUTOMATION ERROR: caso duplicado no registry: ${id}`);
  casos.set(id, executar);
}

export async function executarCaso(id: string, world: IntelligenceWorld): Promise<void> {
  const executar = casos.get(id);
  if (!executar) throw new Error(`AUTOMATION ERROR: nenhum Step executável foi registrado para ${id}.`);
  await executar(world);
}

export function listarCasosRegistrados(): string[] {
  return [...casos.keys()].sort();
}
