import { expect } from '@playwright/test';

import { registrarCaso } from '../../../../utils/common/case-registry';
import { consultarSmart } from '../../../../utils/database/smart';

registrarCaso('BD-POS-CONNECTION-01', async () => {
  const linhas = await consultarSmart<{ integracao: number }>('SELECT 1 AS integracao');
  expect(linhas).toHaveLength(1);
  expect(Number(linhas[0].integracao)).toBe(1);
});
