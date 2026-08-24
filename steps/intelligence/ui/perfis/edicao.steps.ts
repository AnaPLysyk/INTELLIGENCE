import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';
import { autenticarAdmin, envObrigatoria } from '../helpers';

registrarCaso('INT-40-UI-02', async (world) => {
  await world.garantirMassa();
  const page = await autenticarAdmin(world);
  await page.abrirDetalhesDoPerfilPorPguid(
    obterValorObrigatorioDaMassa('PGUID', process.env.INT_40_PGUID),
  );
  await page.abrirEdicaoAtual();
  await page.validarCampoDataPreenchidoNaEdicao(envObrigatoria('INT_40_DATE_FIELD_LABEL'));
});
