import { test, type TestInfo } from '@playwright/test';

function motivoBloqueado(motivo: string): string {
  return /^BLOCKED:/i.test(motivo) ? motivo : `BLOCKED: ${motivo}`;
}

export function bloquearTeste(testInfo: TestInfo, motivo: string): never {
  const descricao = motivoBloqueado(motivo);

  testInfo.annotations.push({ type: 'blocked', description: descricao });
  test.skip(true, descricao);

  throw new Error(descricao);
}

export function urlApiIntelligenceConfigurada(): boolean {
  if (process.env.INTELLIGENCE_API_URL?.trim()) return true;

  const ui = process.env.INTELLIGENCE_UI_URL?.trim().replace(/\/$/, '') || '';
  return /\/react$/i.test(ui);
}

export function pendenciasAcessoCompletoApi(): string[] {
  const pendencias: string[] = [];

  if (!urlApiIntelligenceConfigurada()) {
    pendencias.push('INTELLIGENCE_API_URL ou INTELLIGENCE_UI_URL terminando em /react');
  }
  if (!process.env.INTELLIGENCE_ADMIN_USERNAME?.trim()) {
    pendencias.push('INTELLIGENCE_ADMIN_USERNAME');
  }
  if (!process.env.INTELLIGENCE_ADMIN_PASSWORD?.trim()) {
    pendencias.push('INTELLIGENCE_ADMIN_PASSWORD');
  }

  return pendencias;
}
