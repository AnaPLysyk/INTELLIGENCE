import { TransactionDetailsPage } from '../../../../pom/intelligence/transaction/details.page';
import { abrirSessaoIntelligenceApi } from '../../../../utils/api/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';
import { autenticarAdmin } from '../helpers';

function claimsIntelligence(token: string): string[] {
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
    .filter((claim) => claim.startsWith('intelligence_'))
    .sort();
}

registrarCaso('INT-100-BASELINE', async (world) => {
  await world.garantirMassa();

  const request = await world.api();
  const sessaoAdmin = await abrirSessaoIntelligenceApi(request, world.credenciaisAdmin());
  console.log(`INTELLIGENCE_ADMIN_CLAIMS|permissions=${JSON.stringify(claimsIntelligence(sessaoAdmin.token))}`);

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
