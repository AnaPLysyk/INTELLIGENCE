import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

import { caminhoArquivoMassa, type ArquivoMassaBusca, type EntradaMassaBusca, type IdentidadeEsperada } from './massa-busca';
import { consultarProcessoSmart, autenticarSmart } from '../integracao/smart.api';
import { consultarSmart } from '../integracao/smart.banco';

type ProcessoIndexado = { ProcessId: number; Tguid: string; Pguid: string };
type CampoEncontrado = { nome: string; valor: string };

const ALIASES: Record<string, string[]> = {
  cpf: ['cpf', 'cpfcidadao'],
  name: ['nome', 'fullname', 'name'],
  birthdate: ['birthdate', 'birth_date', 'datanascimento'],
  'EXTERNAL.ID': ['external.id', 'externalid', 'external_id', 'externalidentifier'],
  cib: ['cib', 'cib_exid', 'cibexid'],
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

function entrada(
  seletor: string,
  valor: string,
  esperado: IdentidadeEsperada,
  kind: EntradaMassaBusca['kind'],
  origem: EntradaMassaBusca['origem'],
): EntradaMassaBusca {
  return { seletor, valor, kind, origem, esperado };
}

test('gera massa de busca da Intelligence a partir de processos SMART ja indexados', async ({ request }) => {
  const limite = Number(process.env.SMART_MASSA_LIMITE_CANDIDATOS?.trim() || '30');
  expect(Number.isInteger(limite) && limite > 0 && limite <= 200, 'SMART_MASSA_LIMITE_CANDIDATOS deve estar entre 1 e 200').toBe(true);

  const processos = await consultarSmart<ProcessoIndexado>(
    `SELECT ProcessId, Tguid, Pguid FROM Process
       WHERE Tguid IS NOT NULL AND Tguid <> '' AND Pguid IS NOT NULL AND Pguid <> ''
       ORDER BY ProcessId DESC LIMIT ${limite}`,
  );
  expect(processos.length, 'BLOQUEADO: nenhum processo SMART com TGUID e PGUID foi encontrado.').toBeGreaterThan(0);

  const token = await autenticarSmart(request);
  const buscas: Record<string, EntradaMassaBusca> = {};

  for (const processo of processos) {
    const detalhes = await consultarProcessoSmart(request, token, processo.ProcessId);
    const campos: CampoEncontrado[] = [];
    coletarCampos(detalhes, campos);
    const esperado: IdentidadeEsperada = {
      processId: Number(processo.ProcessId),
      pguid: String(processo.Pguid),
      tguid: String(processo.Tguid),
      nome: encontrar(campos, 'name'),
      cpf: encontrar(campos, 'cpf'),
      dataNascimento: encontrar(campos, 'birthdate'),
      externalId: encontrar(campos, 'EXTERNAL.ID'),
    };

    buscas.PGUID ??= entrada('PGUID', esperado.pguid, esperado, undefined, 'SMART.Process');
    buscas.TGUID ??= entrada('TGUID', esperado.tguid, esperado, undefined, 'SMART.Process');
    if (esperado.cpf) buscas.cpf ??= entrada('cpf', esperado.cpf, esperado, 'KEY', 'SMART API');
    if (esperado.nome) buscas.name ??= entrada('name', esperado.nome, esperado, 'BIOGRAPHIC', 'SMART API');
    if (esperado.dataNascimento) buscas.birthdate ??= entrada('birthdate', esperado.dataNascimento, esperado, 'BIOGRAPHIC', 'SMART API');
    if (esperado.externalId) buscas['EXTERNAL.ID'] ??= entrada('EXTERNAL.ID', esperado.externalId, esperado, 'EXTERNAL_ID', 'SMART API');
    const cib = encontrar(campos, 'cib');
    if (cib) buscas.cib ??= entrada('cib', cib, esperado, 'KEY', 'SMART API');
  }

  const tiposObrigatorios = (process.env.INTELLIGENCE_MASSA_TIPOS || 'PGUID,TGUID,EXTERNAL.ID,cpf,birthdate,name,cib')
    .split(',').map((tipo) => tipo.trim()).filter(Boolean);
  const tiposAusentes = tiposObrigatorios.filter((tipo) => !buscas[tipo]);
  const arquivo: ArquivoMassaBusca = {
    schemaVersion: 1,
    geradoEm: new Date().toISOString(),
    fonte: 'SMART_API_E_BD_SOMENTE_LEITURA',
    buscas,
    tiposAusentes,
  };

  const destino = caminhoArquivoMassa();
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, `${JSON.stringify(arquivo, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });

  expect(tiposAusentes, `BLOQUEADO: o SMART nao forneceu massa confiavel para: ${tiposAusentes.join(', ')}`).toEqual([]);
});
