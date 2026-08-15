import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { consultarSmart } from '../../../support/functions/bd/integracao/smart/smart.repository';

const RELEASE = '5.5.0.5062';
const TAGS = ['@regression', '@bd', '@intelligence', '@positive', '@data-source', '@release-5.5.0.5062'];

test.describe('Intelligence BD — fonte dinâmica SMART somente leitura', () => {
  test(
    '[BD-POS-CONNECTION-01] Valida a conexão somente leitura com o banco SMART',
    { tag: [...TAGS, '@smoke'] },
    async ({}, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'AUTOMATION-DATA-SOURCE', release: RELEASE, objetivo: 'Validar a fonte dinâmica de massa',
      });
      const linhas = await bdd.quando('executa uma consulta SELECT mínima no banco SMART', () =>
        consultarSmart<{ integracao: number }>('SELECT 1 AS integracao'));
      await bdd.entao('a conexão retorna exatamente o marcador esperado', () => {
        expect(linhas).toHaveLength(1);
        expect(Number(linhas[0].integracao)).toBe(1);
      });
    },
  );

  test(
    '[BD-POS-MASSA-01] Encontra processos recentes com TGUID e PGUID para a regressão',
    { tag: [...TAGS, '@documentation', '@int-17'] },
    async ({}, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-17', release: RELEASE, objetivo: 'Garantir massa dinâmica para TGUID e PGUID',
      });
      const linhas = await bdd.quando('consulta processos recentes com identificadores preenchidos', () =>
        consultarSmart<{ ProcessId: number; Tguid: string; Pguid: string }>(
          `SELECT ProcessId, Tguid, Pguid FROM Process
             WHERE Tguid IS NOT NULL AND Tguid <> '' AND Pguid IS NOT NULL AND Pguid <> ''
             ORDER BY ProcessId DESC LIMIT 10`,
        ));
      await bdd.entao('há ao menos um processo utilizável e seus identificadores são válidos', () => {
        expect(linhas.length).toBeGreaterThan(0);
        for (const linha of linhas) {
          expect(Number(linha.ProcessId)).toBeGreaterThan(0);
          expect(String(linha.Tguid).trim()).not.toBe('');
          expect(String(linha.Pguid).trim()).not.toBe('');
        }
      });
    },
  );
});
