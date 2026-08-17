'use strict';

const fs = require('node:fs');
const path = require('node:path');

function mensagensDoResultado(resultado) {
  const mensagens = [];
  if (resultado?.error?.message) mensagens.push(String(resultado.error.message));
  for (const erro of resultado?.errors || []) {
    if (erro?.message) mensagens.push(String(erro.message));
  }
  return [...new Set(mensagens)];
}

function coletarTestes(suites = [], saida = []) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const teste of spec.tests || []) {
        const resultados = teste.results || [];
        const ultimo = resultados[resultados.length - 1] || {};
        saida.push({
          titulo: spec.title || teste.title || '(sem titulo)',
          esperado: teste.expectedStatus || 'passed',
          status: ultimo.status || teste.status || 'unknown',
          mensagens: mensagensDoResultado(ultimo),
        });
      }
    }
    coletarTestes(suite.suites || [], saida);
  }
  return saida;
}

function classificar(relatorio) {
  const testes = coletarTestes(relatorio?.suites || []);
  if (!testes.length) {
    return {
      status: 'FAIL',
      classification: 'PLAYWRIGHT_RESULT_EMPTY',
      testes,
      bloqueados: [],
      falhas: [],
    };
  }

  const naoPassaram = testes.filter((teste) => teste.status !== 'passed');
  const bloqueados = naoPassaram.filter((teste) =>
    teste.mensagens.some((mensagem) => /\bBLOQUEADO:/i.test(mensagem)),
  );
  const falhas = naoPassaram.filter((teste) => !bloqueados.includes(teste));

  if (!naoPassaram.length) {
    return { status: 'PASS', classification: 'PASS', testes, bloqueados, falhas };
  }

  if (bloqueados.length === naoPassaram.length) {
    return {
      status: 'BLOCKED',
      classification: 'IDENTITY_BLOCKED',
      testes,
      bloqueados,
      falhas,
    };
  }

  return {
    status: 'FAIL',
    classification: 'FUNCTIONAL_OR_AUTOMATION_FAILURE',
    testes,
    bloqueados,
    falhas,
  };
}

function resumoTeste(teste) {
  return {
    titulo: teste.titulo,
    status: teste.status,
    mensagem: teste.mensagens[0] || null,
  };
}

function main() {
  const raiz = path.resolve(__dirname, '..', '..');
  const resultsDir = path.join(raiz, 'test-results');
  const origem = path.join(resultsDir, 'results.json');
  const destino = path.join(resultsDir, 'qa-result.json');

  if (!fs.existsSync(origem)) {
    process.stderr.write(`[qa-result] resultado Playwright ausente: ${origem}\n`);
    process.exitCode = 1;
    return;
  }

  let relatorio;
  try {
    relatorio = JSON.parse(fs.readFileSync(origem, 'utf8'));
  } catch (error_) {
    process.stderr.write(`[qa-result] JSON Playwright invalido: ${error_.message}\n`);
    process.exitCode = 1;
    return;
  }

  const classificacao = classificar(relatorio);
  const total = classificacao.testes.length;
  const passed = classificacao.testes.filter((teste) => teste.status === 'passed').length;

  const saida = {
    status: classificacao.status,
    classification: classificacao.classification,
    evidencePath: resultsDir,
    variaveis: {
      QA_TEST_TOTAL: String(total),
      QA_TEST_PASSED: String(passed),
      QA_TEST_BLOCKED: String(classificacao.bloqueados.length),
      QA_TEST_FAILED: String(classificacao.falhas.length),
      QA_TICKET_KEY: process.env.QA_TICKET_KEY || null,
      QA_BLOCKED_DETAILS_JSON: JSON.stringify(classificacao.bloqueados.map(resumoTeste)),
      QA_FAILURE_DETAILS_JSON: JSON.stringify(classificacao.falhas.map(resumoTeste)),
    },
  };

  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(destino, `${JSON.stringify(saida, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `[qa-result] status=${saida.status} classification=${saida.classification} total=${total} passed=${passed} blocked=${classificacao.bloqueados.length} failed=${classificacao.falhas.length}\n`,
  );
}

if (require.main === module) main();

module.exports = { classificar, coletarTestes, mensagensDoResultado };
