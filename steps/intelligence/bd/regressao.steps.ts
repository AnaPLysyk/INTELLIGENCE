import { expect } from '@playwright/test';

import { registrarCaso } from '../../../utils/common/case-registry';
import { consultarSmart } from '../../../utils/database/smart';

registrarCaso('BD-POS-CONNECTION-01', async () => {
  const linhas = await consultarSmart<{ integracao: number }>('SELECT 1 AS integracao');
  expect(linhas).toHaveLength(1);
  expect(Number(linhas[0].integracao)).toBe(1);
});

registrarCaso('BD-POS-MASSA-01', async () => {
  const linhas = await consultarSmart<{ ProcessId: number; Tguid: string; Pguid: string }>(
    `SELECT ProcessId, Tguid, Pguid FROM Process
       WHERE Tguid IS NOT NULL AND Tguid <> '' AND Pguid IS NOT NULL AND Pguid <> ''
       ORDER BY ProcessId DESC LIMIT 10`,
  );
  expect(linhas.length).toBeGreaterThan(0);
  for (const linha of linhas) {
    expect(Number(linha.ProcessId)).toBeGreaterThan(0);
    expect(String(linha.Tguid).trim()).not.toBe('');
    expect(String(linha.Pguid).trim()).not.toBe('');
  }
});

for (const caso of [
  { id: 'BD-DES-INSERT-01', sql: 'INSERT INTO Process (ProcessId) VALUES (0)' },
  { id: 'BD-DES-UPDATE-01', sql: 'UPDATE Process SET ProcessId = ProcessId' },
  { id: 'BD-DES-DELETE-01', sql: 'DELETE FROM Process WHERE ProcessId = 0' },
  { id: 'BD-DES-STACKED-01', sql: 'SELECT 1; DELETE FROM Process WHERE ProcessId = 0' },
]) {
  registrarCaso(caso.id, async () => {
    let erro: unknown;
    try {
      await consultarSmart(caso.sql);
    } catch (falha) {
      erro = falha;
    }
    expect(erro).toBeInstanceOf(Error);
    expect((erro as Error).message).toMatch(/SEGURANCA:/);
  });
}
