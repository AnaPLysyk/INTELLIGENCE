import { request } from '@playwright/test';

import './config/ambiente';
import { validarAmbienteIntegracao } from './config/ambiente';
import { gerarMassaDeBuscaComDadosDoSmart } from './functions/provisionamento/intelligence/gerar-massa-busca.flow';

export default async function globalSetup(): Promise<void> {
  validarAmbienteIntegracao();
  const contexto = await request.newContext();
  try {
    await gerarMassaDeBuscaComDadosDoSmart(contexto);
  } finally {
    await contexto.dispose();
  }
}
