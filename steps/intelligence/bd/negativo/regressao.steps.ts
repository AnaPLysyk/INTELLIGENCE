import { expect } from '@playwright/test';

import { registrarCaso } from '../../../../utils/common/case-registry';
import { consultarSmart } from '../../../../utils/database/smart';

for (const caso of [
  { id: 'BD-DES-INSERT-01', sql: 'INSERT INTO Process (ProcessId) VALUES (0)' },
  { id: 'BD-DES-UPDATE-01', sql: 'UPDATE Process SET ProcessId = ProcessId' },
  { id: 'BD-DES-DELETE-01', sql: 'DELETE FROM Process WHERE ProcessId = 0' },
  { id: 'BD-DES-STACKED-01', sql: 'SELECT 1; DELETE FROM Process WHERE ProcessId = 0' },
]) {
  registrarCaso(caso.id, async () => {
    let erro: unknown;
    try { await consultarSmart(caso.sql); } catch (falha) { erro = falha; }
    expect(erro).toBeInstanceOf(Error);
    expect((erro as Error).message).toMatch(/SEGURANCA:/);
  });
}
