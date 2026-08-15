import path from 'node:path';

import { defineConfig } from '@playwright/test';
import '../config/ambiente';

export default defineConfig({
  testDir: '../functions/provisionamento/intelligence',
  testMatch: 'gerar-massa-busca.flow.spec.ts',
  outputDir: path.resolve(__dirname, '../../test-results/massa'),
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 180_000,
  reporter: [['list']],
});
