'use strict';

const { spawnSync } = require('node:child_process');

/**
 * Traduz QA_TICKET_KEY (ex: "INT-100", injetado pelo qa-orchestrator via
 * `qa run --project intelligence --ticket INT-100 porTicket`) na tag usada
 * nos titulos dos testes (ex: "@int-100") e roda so os testes dessa tag,
 * em qualquer camada (api/bd/ui) onde ela aparecer.
 */
const ticket = String(process.env.QA_TICKET_KEY || '').trim();
if (!ticket) {
  console.error('QA_TICKET_KEY nao informado. Uso: qa run --project intelligence --ticket INT-100 porTicket');
  process.exit(2);
}

const tag = `@${ticket.toLowerCase()}`;
const resultado = spawnSync('npx', ['playwright', 'test', '--grep', tag], { stdio: 'inherit', shell: true });
process.exit(typeof resultado.status === 'number' ? resultado.status : 1);
