import fs from 'node:fs';
import path from 'node:path';

import { defineStep, Given, Then, When } from '@cucumber/cucumber';

import type { IntelligenceWorld } from '../../../cucumber/world';
import { executarCaso, obterCasoRegistrado } from '../../../utils/common/case-registry';

const CHAVE_BDD_EXECUTADO = 'bdd:caso-executado';
const RAIZ_REPOSITORIO = path.resolve(__dirname, '../../../..');
const RAIZ_FEATURES = path.join(RAIZ_REPOSITORIO, 'features', 'intelligence');

type PapelPasso = 'contexto' | 'acao' | 'resultado';
type RegistroPasso = {
  texto: string;
  papeis: Set<PapelPasso>;
};

function exigirCaseId(world: IntelligenceWorld): string {
  if (!world.caseId) {
    throw new Error('AUTOMATION ERROR: cenário sem identificação @case-<ID>.');
  }
  return world.caseId;
}

async function executarCasoAtual(world: IntelligenceWorld): Promise<void> {
  if (world.state.get(CHAVE_BDD_EXECUTADO) === true) return;

  const id = exigirCaseId(world);
  const caso = obterCasoRegistrado(id);
  await world.registrarCaso(caso.id, caso.nome);
  await executarCaso(caso.id, world);
  world.state.set(CHAVE_BDD_EXECUTADO, true);
}

function confirmarExecucao(world: IntelligenceWorld): void {
  if (world.state.get(CHAVE_BDD_EXECUTADO) !== true) {
    throw new Error(
      `AUTOMATION ERROR: comportamento do caso ${exigirCaseId(world)} ainda não foi executado. `
      + 'O cenário BDD precisa conter um passo Quando antes das validações.',
    );
  }
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listarFeatures(dir: string, saida: string[] = []): string[] {
  if (!fs.existsSync(dir)) return saida;

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const caminho = path.join(dir, item.name);
    if (item.isDirectory()) listarFeatures(caminho, saida);
    else if (item.isFile() && item.name.endsWith('.feature')) saida.push(caminho);
  }

  return saida;
}

function papelDoKeyword(keyword: string, anterior?: PapelPasso): PapelPasso | undefined {
  if (keyword === 'Dado') return 'contexto';
  if (keyword === 'Quando') return 'acao';
  if (keyword === 'Então') return 'resultado';
  if (keyword === 'E' || keyword === 'Mas') return anterior;
  return undefined;
}

function extrairPassosBdd(): RegistroPasso[] {
  const registros = new Map<string, RegistroPasso>();

  for (const feature of listarFeatures(RAIZ_FEATURES)) {
    let papelAnterior: PapelPasso | undefined;

    for (const linha of fs.readFileSync(feature, 'utf8').split(/\r?\n/)) {
      const match = linha.match(/^\s*(Dado|Quando|Então|E|Mas)\s+(.+?)\s*$/u);
      if (!match) continue;

      const [, keyword, texto] = match;
      const papel = papelDoKeyword(keyword, papelAnterior);
      if (!papel) continue;
      papelAnterior = papel;

      const atual = registros.get(texto) ?? { texto, papeis: new Set<PapelPasso>() };
      atual.papeis.add(papel);
      registros.set(texto, atual);
    }
  }

  return [...registros.values()].sort((a, b) => a.texto.localeCompare(b.texto, 'pt-BR'));
}

function papelEfetivo(registro: RegistroPasso): PapelPasso {
  // Se uma mesma frase aparecer em mais de um papel, a ação prevalece porque
  // ela é o ponto em que o comportamento executável do @case-* deve rodar.
  if (registro.papeis.has('acao')) return 'acao';
  if (registro.papeis.has('resultado')) return 'resultado';
  return 'contexto';
}

function registrarPassosBddDasFeatures(): void {
  for (const registro of extrairPassosBdd()) {
    const expressao = new RegExp(`^${escaparRegex(registro.texto)}$`, 'u');
    const papel = papelEfetivo(registro);

    defineStep(expressao, async function (this: IntelligenceWorld) {
      if (papel === 'contexto') {
        exigirCaseId(this);
        return;
      }

      if (papel === 'acao') {
        await executarCasoAtual(this);
        return;
      }

      confirmarExecucao(this);
    });
  }
}

// Compatibilidade temporária com qualquer Feature antiga ainda não migrada.
// O validador estrutural proíbe que novos cenários usem estas frases.
Given('que o caso {string} está preparado', function (this: IntelligenceWorld, id: string) {
  this.caseId = id;
});

Given('que o caso automatizado está preparado', function (this: IntelligenceWorld) {
  exigirCaseId(this);
});

When('executo o comportamento automatizado do caso', async function (this: IntelligenceWorld) {
  await executarCasoAtual(this);
});

Then('o contrato automatizado deve ser atendido', function (this: IntelligenceWorld) {
  confirmarExecucao(this);
});

registrarPassosBddDasFeatures();
