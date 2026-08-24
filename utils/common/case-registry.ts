import type { IntelligenceWorld } from '../../cucumber/world';

export type CasoAutomatizado = (world: IntelligenceWorld) => Promise<void>;

export type CasoRegistrado = {
  id: string;
  nome: string;
  executar: CasoAutomatizado;
};

const casos = new Map<string, CasoRegistrado>();

export function teste(id: string, nome: string, executar: CasoAutomatizado): void {
  const identificador = id.trim();
  const titulo = nome.trim();

  if (!identificador) throw new Error('AUTOMATION ERROR: teste sem identificador.');
  if (!titulo) throw new Error(`AUTOMATION ERROR: teste ${identificador} sem nome legivel.`);
  if (casos.has(identificador)) {
    throw new Error(`AUTOMATION ERROR: caso duplicado no registry: ${identificador}`);
  }

  casos.set(identificador, { id: identificador, nome: titulo, executar });
}

// Compatibilidade temporaria para arquivos ainda nao migrados para teste(id, nome, executar).
export function registrarCaso(id: string, executar: CasoAutomatizado): void {
  teste(id, id, executar);
}

export function obterCasoRegistrado(id: string): CasoRegistrado {
  const caso = casos.get(id);
  if (!caso) throw new Error(`AUTOMATION ERROR: nenhum Step executavel foi registrado para ${id}.`);
  return caso;
}

export async function executarCaso(id: string, world: IntelligenceWorld): Promise<void> {
  await obterCasoRegistrado(id).executar(world);
}

export function listarCasosRegistrados(): Array<Pick<CasoRegistrado, 'id' | 'nome'>> {
  return [...casos.values()]
    .map(({ id, nome }) => ({ id, nome }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
