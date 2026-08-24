'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ticket = String(process.env.QA_TICKET_KEY || '').trim();
if (!ticket) {
  console.error('QA_TICKET_KEY nao informado. Uso: qa run --project intelligence --ticket INT-100 porTicket');
  process.exit(2);
}

const resultado = spawnSync(process.execPath, [path.resolve(__dirname, '..', 'orchestrator.cjs'), 'regression'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: false,
  env: process.env,
});
process.exit(typeof resultado.status === 'number' ? resultado.status : 1);
