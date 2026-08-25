import { TransactionDetailsPage } from '../../../../pom/intelligence/transaction/details.page';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';
import { autenticarAdmin } from '../helpers';

registrarCaso('INT-100-BASELINE', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
  await new TransactionDetailsPage(await world.pagina()).validarEdicaoDisponivel();
});

registrarCaso('INT-100-I1', async (world) => {
  await world.garantirMassa();
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
  await page.abrirDetalhesDaTransacaoPorTguid(tguid);
  await page.validarDetalhesDaTransacaoCarregados(tguid);
  await page.validarAusenciaDeControlesDeEscrita();
});
