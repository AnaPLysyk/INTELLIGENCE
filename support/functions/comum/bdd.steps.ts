import { test, type TestInfo } from '@playwright/test';

type Acao = <T>(descricao: string, executar: () => Promise<T> | T) => Promise<T>;

export async function criarCenarioBDD(
  testInfo: TestInfo,
  dados: { ticket: string; release: string; objetivo: string },
): Promise<{ dado: Acao; quando: Acao; entao: Acao; e: Acao }> {
  await testInfo.attach('cenario.json', {
    body: JSON.stringify(dados, null, 2),
    contentType: 'application/json',
  });

  return {
    dado: (descricao, executar) => test.step(`Dado que ${descricao}`, executar),
    quando: (descricao, executar) => test.step(`Quando ${descricao}`, executar),
    entao: (descricao, executar) => test.step(`Então ${descricao}`, executar),
    e: (descricao, executar) => test.step(`E ${descricao}`, executar),
  };
}
