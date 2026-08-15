import { expect, test } from '@playwright/test';

import { cenario } from '../../support/functions/cenario';
import {
  autenticarIntelligenceApi,
  buscarPerfisIntelligence,
  contemValor,
  extrairContagem,
  extrairItens,
  payloadDaMassa,
} from '../../support/functions/intelligence/intelligence.api';
import { lerMassaBusca } from '../../support/functions/massa/massa-busca';
import {
  bloquearTeste,
  pendenciasAcessoCompletoApi,
} from '../../support/functions/intelligence/intelligence.precondicoes';

const REL = '5.5.0.5062';

const CASOS = [
  { id: 'API-POS-CPF-01', tipo: 'cpf', descricao: 'CPF' },
  { id: 'API-POS-EXTERNAL-01', tipo: 'EXTERNAL.ID', descricao: 'ID externo' },
  { id: 'API-POS-BIRTHDATE-01', tipo: 'birthdate', descricao: 'data de nascimento' },
  { id: 'API-POS-NAME-01', tipo: 'name', descricao: 'nome' },
  { id: 'API-POS-CIB-01', tipo: 'cib', descricao: 'CIB' },
] as const;

test.describe('INTELLIGENCE | API (positivo)', () => {
  for (const caso of CASOS) {
    test(`@api @intelligence @search @positive @release-5.5.0.5062 | ${caso.id} - busca por ${caso.descricao} retorna o perfil esperado`, async ({ request }, testInfo) => {
      const pendencias = pendenciasAcessoCompletoApi();
      if (pendencias.length > 0) {
        bloquearTeste(testInfo, `configuração ausente para API Intelligence: ${pendencias.join(', ')}.`);
      }

      const entrada = lerMassaBusca(true)?.buscas[caso.tipo];
      if (!entrada) {
        bloquearTeste(testInfo, `a massa gerada não possui uma entrada para ${caso.tipo}. Execute npm run massa:smart.`);
      }
      const passo = await cenario(testInfo, {
        ticket: caso.id,
        release: REL,
        objetivo: `Validar contrato count/list da busca por ${caso.descricao}`,
      });

      const token = await passo.dado('um usuario de acesso completo autenticado na API', () => autenticarIntelligenceApi(request));
      const resultado = await passo.quando(`consulta count e list com a massa real de ${caso.descricao}`, () =>
        buscarPerfisIntelligence(request, payloadDaMassa(entrada), token));

      await passo.entao('as respostas sao bem-sucedidas, coerentes e contem o perfil esperado', () => {
        expect(resultado.count.response.ok(), `count retornou HTTP ${resultado.count.response.status()}`).toBe(true);
        expect(resultado.list.response.ok(), `list retornou HTTP ${resultado.list.response.status()}`).toBe(true);

        const total = extrairContagem(resultado.count.body);
        const itens = extrairItens(resultado.list.body);
        expect(total, 'count deve indicar pelo menos um perfil').toBeGreaterThan(0);
        expect(itens.length, 'list deve retornar pelo menos um perfil').toBeGreaterThan(0);
        expect(total, 'count nao pode ser menor que a pagina retornada').toBeGreaterThanOrEqual(itens.length);
        expect(
          contemValor(itens, entrada.esperado.pguid),
          'a lista deve conter o PGUID esperado pela massa gerada',
        ).toBe(true);
      });
    });
  }
});
