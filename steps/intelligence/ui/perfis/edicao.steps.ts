import { ProfileEditingPage } from '../../../../pom/intelligence/profile/editing.page';
import { abrirSessaoIntelligenceApi } from '../../../../utils/api/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { autenticarAdmin } from '../helpers';

function claimsEdicao(token: string): string[] {
  const partes = token.split('.');
  if (partes.length < 2) {
    throw new Error('AUTOMATION ERROR: token administrativo do Intelligence não é um JWT reconhecível.');
  }

  const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8')) as {
    permissions?: unknown;
  };

  if (!Array.isArray(payload.permissions)) {
    throw new Error('AUTOMATION ERROR: token administrativo do Intelligence não possui permissions[].');
  }

  return payload.permissions
    .filter((claim): claim is string => typeof claim === 'string')
    .filter((claim) =>
      claim.startsWith('intelligence_')
      || claim === 'edit_person'
      || claim === 'edit_transaction'
      || claim.startsWith('org_'),
    )
    .sort();
}

registrarCaso('INT-40-UI-02', async (world) => {
  const massa = await world.garantirMassa();
  const transacao = massa.buscas.TGUID;
  const pguid = process.env.INT_40_PGUID?.trim() || transacao?.esperado.pguid?.trim();

  if (!pguid) {
    throw new Error('BLOQUEADO: a massa de TGUID não informa o PGUID vinculado para validar o INT-40 no perfil.');
  }

  const request = await world.api();
  const sessao = await abrirSessaoIntelligenceApi(request, world.credenciaisAdmin());
  console.log(`INTELLIGENCE_EDIT_PROFILE_CLAIMS|permissions=${JSON.stringify(claimsEdicao(sessao.token))}`);

  const page = await autenticarAdmin(world);
  await page.abrirDetalhesDoPerfilPorPguid(pguid);
  await page.abrirEdicaoAtual();
  await new ProfileEditingPage(await world.pagina()).validarAlgumCampoDataPreenchido();
});
