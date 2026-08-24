import { registrarCaso } from '../../../../utils/common/case-registry';

registrarCaso('UI-NEG-AUTH-NOACCESS-01', async (world) => {
  const page = await world.intelligence();
  await page.validarAutenticacaoNegadaComCredenciais(world.credenciaisSemPermissao());
});
