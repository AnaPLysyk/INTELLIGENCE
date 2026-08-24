import { registrarCaso } from '../../../../utils/common/case-registry';

registrarCaso('INT-100-I6', async (world) => {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  await page.abrirConfiguracoesPeloHeader();
  await page.abrirTelaViewOnlyPeloLogo();
  await page.validarTelaViewOnly();
});

registrarCaso('INT-100-I7', async (world) => {
  const page = await world.intelligence();
  await page.autenticarComCredenciais(await world.credenciaisViewOnly());
  await page.abrirPaginaNaoEncontrada();
  await page.voltarDaPaginaNaoEncontrada();
  await page.validarTelaViewOnly();
});
