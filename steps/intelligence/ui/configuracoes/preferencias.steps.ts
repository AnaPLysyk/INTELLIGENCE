import { registrarCaso } from '../../../../utils/common/case-registry';

registrarCaso('INT-100-I4', async (world) => {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  await page.abrirConfiguracoesPeloHeader();
  await page.validarConfiguracoesDisponiveisViewOnly();
});
