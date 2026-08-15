import path from 'node:path';

import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });

export default defineConfig({
  testDir: './functions/massa',
  testMatch: 'gerar-massa-busca.smart.spec.ts',
  outputDir: path.resolve(__dirname, '../test-results/massa'),
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list']],
});
