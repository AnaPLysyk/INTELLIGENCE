import { ProfileEditingPage } from '../../../../pom/intelligence/profile/editing.page';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { autenticarAdmin } from '../helpers';

registrarCaso('INT-40-UI-02', async (world) => {
  const massa = await world.garantirMassa();
  const transacao = massa.buscas.TGUID;
  const pguid = process.env.INT_40_PGUID?.trim() || transacao?.esperado.pguid?.trim();

  if (!pguid) {
    throw new Error('BLOQUEADO: a massa de TGUID não informa o PGUID vinculado para validar o INT-40 no perfil.');
  }

  const page = await autenticarAdmin(world);
  await page.abrirDetalhesDoPerfilPorPguid(pguid);
  await page.abrirEdicaoAtual();
  await new ProfileEditingPage(await world.pagina()).validarAlgumCampoDataPreenchido();
});
