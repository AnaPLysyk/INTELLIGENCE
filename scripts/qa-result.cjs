'use strict';

const fs = require('node:fs');
const path = require('node:path');

function coletarCenarios(features) {
  const cenarios = [];
  for (const feature of features || []) {
    for (const elemento of feature.elements || []) {
      if (elemento.type && elemento.type !== 'scenario') continue;
      const passos = elemento.steps || [];
      const mensagens = passos.flatMap((passo) => {
        const mensagem = passo?.result?.error_message;
        return mensagem ? [String(mensagem)] : [];
      });
      const statuses = passos.map((passo) => String(passo?.result?.status || 'unknown').toLowerCase());
      const status = statuses.length > 0 && statuses.every((item) => item === 'passed') ? 'passed' : 'failed';
      cenarios.push({ titulo: elemento.name || '(sem titulo)', status, mensagens });
    }
  }
  return cenarios;
}

function classificar(features) {
  const cenarios = coletarCenarios(features);
  if (!cenarios.length) return { status: 'FAIL', classification: 'CUCUMBER_RESULT_EMPTY', cenarios, bloqueados: [], falhas: [] };
  const naoPassaram = cenarios.filter((cenario) => cenario.status !== 'passed');
  const bloqueados = naoPassaram.filter((cenario) => cenario.mensagens.some((mensagem) => /\bBLOQUEADO:/i.test(mensagem)));
  const falhas = naoPassaram.filter((cenario) => !bloqueados.includes(cenario));
  if (!naoPassaram.length) return { status: 'PASS', classification: 'PASS', cenarios, bloqueados, falhas };
  if (!falhas.length) return { status: 'BLOCKED', classification: 'BLOCKED', cenarios, bloqueados, falhas };
  return { status: 'FAIL', classification: 'FUNCTIONAL_OR_AUTOMATION_FAILURE', cenarios, bloqueados, falhas };
}

function resumo(cenario) {
  return { titulo: cenario.titulo, status: cenario.status, mensagem: cenario.mensagens[0] || null };
}

function main() {
  const raiz = path.resolve(__dirname, '..');
  const resultsDir = path.join(raiz, 'test-results');
  const origem = path.join(resultsDir, 'cucumber.json');
  const destino = path.join(resultsDir, 'qa-result.json');
  if (!fs.existsSync(origem)) {
    console.error(`[qa-result] resultado Cucumber ausente: ${origem}`);
    process.exit(1);
  }
  const features = JSON.parse(fs.readFileSync(origem, 'utf8'));
  const classificacao = classificar(features);
  const total = classificacao.cenarios.length;
  const passed = classificacao.cenarios.filter((cenario) => cenario.status === 'passed').length;
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
      QA_BLOCKED_DETAILS_JSON: JSON.stringify(classificacao.bloqueados.map(resumo)),
      QA_FAILURE_DETAILS_JSON: JSON.stringify(classificacao.falhas.map(resumo)),
    },
  };
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(destino, `${JSON.stringify(saida, null, 2)}\n`, 'utf8');
  console.log(`[qa-result] status=${saida.status} classification=${saida.classification} total=${total} passed=${passed} blocked=${classificacao.bloqueados.length} failed=${classificacao.falhas.length}`);
}

if (require.main === module) main();
module.exports = { classificar, coletarCenarios };
