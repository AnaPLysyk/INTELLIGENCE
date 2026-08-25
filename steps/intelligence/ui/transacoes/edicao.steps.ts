import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';
import { autenticarSmart, consultarProcessoSmart } from '../../../../utils/integrations/smart';
import { autenticarAdmin, idsCampos } from '../helpers';

registrarCaso('INT-31-UI-01', async (world) => {
  const massa = await world.garantirMassa();
  const transacao = massa.buscas.TGUID;
  if (!transacao?.valor || !transacao.esperado.processId) {
    throw new Error('BLOQUEADO: a massa de TGUID não informa a transação SMART de origem.');
  }

  const request = await world.api();
  const token = await autenticarSmart(request);
  const detalhes = await consultarProcessoSmart(request, token, transacao.esperado.processId);
  const chaves = idsCampos(detalhes, 'keys');
  if (!chaves.length) {
    throw new Error('BLOQUEADO: a transação SMART não possui campos-chave para validar o INT-31.');
  }

  const page = await autenticarAdmin(world);
  await page.abrirDetalhesDaTransacaoPorTguid(transacao.valor);
  await page.validarDetalhesDaTransacaoCarregados(transacao.valor);
  await page.abrirEdicaoAtual();
  for (const chave of chaves) await page.validarCampoNaoDisponivelParaEdicao(chave);
});

registrarCaso('INT-40-UI-01', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_40_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
  await page.abrirEdicaoAtual();
  await page.validarAlgumCampoDataPreenchidoNaEdicao();
});

registrarCaso('INT-32-UI-01', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_32_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
  await page.abrirEdicaoAtual();
  await page.validarAlgumCampoDataComCalendarioNaEdicao();
});

registrarCaso('INT-33-SPEC-01', async () => {
  throw new Error(
    'BLOQUEADO: INT-33 não informa quais campos devem ser convertidos para maiúsculas nem quais validações são esperadas.',
  );
});
