'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { limparCucumberDist } = require('./scripts/clean-cucumber.cjs');

const root = __dirname;
const plan = JSON.parse(fs.readFileSync(path.join(root, 'automation.plan.json'), 'utf8'));

function fail(message) {
  console.error(`[orchestrator] ${message}`);
  process.exit(2);
}

function suiteFromSchedule(schedule) {
  const matches = Object.entries(plan.suites).filter(([, suite]) => suite.schedule === schedule);
  if (matches.length !== 1) fail(`agenda nao mapeada ou duplicada: ${schedule || '(vazia)'}`);
  return matches[0][0];
}

function ticketFromEnv() {
  const ticket = process.env.QA_TICKET_KEY?.trim();
  if (!ticket) return null;
  if (!/^[A-Z][A-Z0-9]+-\d+$/i.test(ticket)) fail(`ticket invalido recebido em QA_TICKET_KEY: ${ticket}`);
  return ticket.toUpperCase();
}

function caseIdFromEnv() {
  const caseId = process.env.QA_CASE_ID?.trim();
  if (!caseId) return null;
  if (!/^[A-Za-z0-9._:-]+$/.test(caseId)) fail(`case-id invalido recebido em QA_CASE_ID: ${caseId}`);
  return caseId;
}

function releaseFromContext(args) {
  const inline = args.find((arg) => arg.startsWith('--release-version='));
  const release = inline?.slice('--release-version='.length).trim() || process.env.QA_RELEASE_VERSION?.trim() || null;
  if (!release) return null;
  if (release !== 'unassigned' && !/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(release)) fail(`release historica invalida: ${release}`);
  return release;
}

function tagExpressionFromTickets(tickets) {
  if (!Array.isArray(tickets) || !tickets.length) fail('release historica sem tickets mapeados');
  return tickets.map((ticket) => `@${ticket.toLowerCase()}`).join(' or ');
}

function combinarTags(base, filtro) {
  if (!filtro) return base;
  return `(${base}) and ${filtro}`;
}

function build() {
  limparCucumberDist(root);
  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const result = spawnSync(process.execPath, [tsc, '-p', 'tsconfig.cucumber.json'], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function executarProcesso(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.once('error', reject);
    child.once('close', (code, signal) => {
      resolve({ status: typeof code === 'number' ? code : null, signal: signal || null });
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const scheduled = args.includes('--scheduled');
  const explicit = args.find((arg) => !arg.startsWith('--'));
  const suiteName = explicit || process.env.AUTOMATION_SUITE?.trim()
    || (scheduled ? suiteFromSchedule(process.env.GITHUB_EVENT_SCHEDULE?.trim()) : plan.defaultSuite);
  const suite = plan.suites[suiteName];
  if (!suite) fail(`suite desconhecida '${suiteName}'. Opcoes: ${Object.keys(plan.suites).join(', ')}`);

  const ticket = ticketFromEnv();
  const caseId = caseIdFromEnv();
  const historicalRelease = releaseFromContext(args);
  if (historicalRelease && suiteName !== 'release') fail('release historica deve ser executada pela suite release');
  const historicalTickets = historicalRelease ? plan.releaseHistory?.[historicalRelease] : null;
  if (historicalRelease && !historicalTickets) fail(`release historica nao mapeada: ${historicalRelease}`);

  let tags;
  if (historicalRelease) {
    tags = `(${tagExpressionFromTickets(historicalTickets)})`;
  } else {
    tags = suite.grep;
    if (ticket) tags = combinarTags(tags, `@${ticket.toLowerCase()}`);
    if (caseId) tags = combinarTags(tags, `@case-${caseId}`);
  }
  const selectedRelease = historicalRelease || plan.release;

  if (args.includes('--show-plan')) {
    console.log(JSON.stringify({
      project: plan.project,
      release: selectedRelease,
      ...suite,
      selectedSuite: suiteName,
      selectedTicket: ticket,
      selectedCaseId: caseId,
      selectedHistoricalRelease: historicalRelease,
      selectedHistoricalTickets: historicalTickets,
      selectedTags: tags,
    }, null, 2));
    return 0;
  }

  build();
  const cucumberCli = path.join(root, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
  const cucumberArgs = [cucumberCli, '--config', 'cucumber.cjs', '--tags', tags];
  const listOnly = args.includes('--list');
  if (listOnly) cucumberArgs.push('--dry-run', '--format', 'summary');

  console.log(
    `[orchestrator] project=${plan.project} suite=${suiteName} release=${selectedRelease} tags=${tags} tests=${ticket || caseId || historicalRelease ? 'filtered' : suite.expectedTests}`,
  );
  console.log(`[orchestrator] cucumber-run mode=${listOnly ? 'dry-run' : 'execute'} status=START`);

  let result;
  try {
    result = await executarProcesso(process.execPath, cucumberArgs, {
      cwd: root,
      stdio: 'inherit',
      shell: false,
      env: process.env,
    });
  } catch (error_) {
    fail(`falha ao iniciar Cucumber: ${error_.message}`);
  }

  console.log(
    `[orchestrator] cucumber-run mode=${listOnly ? 'dry-run' : 'execute'} status=END exitCode=${result.status ?? 'null'} signal=${result.signal || '-'}`,
  );

  if (result.status === null) {
    fail(`Cucumber terminou sem exit code${result.signal ? ` (signal=${result.signal})` : ''}.`);
  }

  if (!listOnly) {
    const qa = spawnSync(process.execPath, [path.join(root, 'scripts', 'qa-result.cjs')], {
      cwd: root,
      stdio: 'inherit',
      shell: false,
      env: process.env,
    });
    if (qa.error) fail(qa.error.message);
    if (qa.status !== 0) return qa.status ?? 1;
  }

  return result.status ?? 1;
}

main()
  .then((exitCode) => {
    process.exitCode = typeof exitCode === 'number' ? exitCode : 1;
  })
  .catch((error_) => {
    console.error(`[orchestrator] erro inesperado: ${error_.stack || error_.message}`);
    process.exitCode = 1;
  });
