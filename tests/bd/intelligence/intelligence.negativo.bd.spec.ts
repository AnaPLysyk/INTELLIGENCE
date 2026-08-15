import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { consultarSmart } from '../../../support/functions/bd/integracao/smart/smart.repository';

const RELEASE = '5.5.0.5062';
const TAGS = ['@regression', '@bd', '@intelligence', '@negative', '@destructive', '@security', '@release-5.5.0.5062'];
const COMANDOS_PROIBIDOS = [
  { id: 'BD-DES-INSERT-01', titulo: 'Bloqueia INSERT no banco de origem', sql: 'INSERT INTO Process (ProcessId) VALUES (0)' },
  { id: 'BD-DES-UPDATE-01', titulo: 'Bloqueia UPDATE no banco de origem', sql: 'UPDATE Process SET ProcessId = ProcessId' },
  { id: 'BD-DES-DELETE-01', titulo: 'Bloqueia DELETE no banco de origem', sql: 'DELETE FROM Process WHERE ProcessId = 0' },
  { id: 'BD-DES-STACKED-01', titulo: 'Bloqueia SQL empilhado após SELECT', sql: 'SELECT 1; DELETE FROM Process WHERE ProcessId = 0' },
] as const;

test.describe('Intelligence BD — proteção destrutiva da fonte SMART', () => {
  for (const caso of COMANDOS_PROIBIDOS) {
    test(
      `[${caso.id}] ${caso.titulo}`,
      { tag: TAGS },
      async ({}, testInfo) => {
        const bdd = await criarCenarioBDD(testInfo, {
          ticket: caso.id, release: RELEASE, objetivo: caso.titulo,
        });
        const erro = await bdd.quando('a automação recebe um comando potencialmente destrutivo', async () => {
          try {
            await consultarSmart(caso.sql);
            return undefined;
          } catch (falha) {
            return falha;
          }
        });
        await bdd.entao('o comando é rejeitado antes de alcançar o banco', () => {
          expect(erro).toBeInstanceOf(Error);
          expect((erro as Error).message).toMatch(/SEGURANCA:/);
        });
      },
    );
  }
});
