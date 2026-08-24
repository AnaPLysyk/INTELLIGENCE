import { registrarCaso } from '../../../../utils/common/case-registry';

registrarCaso('INT-100-WRITE-ENDPOINTS-01', async () => {
  throw new Error(
    'BLOQUEADO: INT-100 nao documenta o contrato (metodo, path params e body) dos endpoints de escrita. '
    + 'Nao e seguro adivinhar chamadas que poderiam mutar dados reais caso a autorizacao esteja quebrada.',
  );
});
