const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const planPath = path.resolve(__dirname, 'automation.plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

function fail(message) {
  process.stderr.write(`[orchestrator] ${message}\n`);
  process.exit(2);
}

function suiteFromSchedule(schedule) {
  const matches = Object.entries(plan.suites).filter(([, suite]) => suite.schedule === schedule);
  if (matches.length !== 1) {
    fail(`agenda nao mapeada ou duplicada: ${schedule || '(vazia)'}`);
  }
  return matches[0][0];
}

function ticketFromEnv() {
  const ticket = process.env.QA_TICKET_KEY?.trim();
  if (!ticket) return null;
  if (!/^[A-Z][A-Z0-9]+-\d+$/i.test(ticket)) {
    fail(`ticket invalido recebido em QA_TICKET_KEY: ${ticket}`);
  }
  return ticket.toUpperCase();
}

function releaseFromContext(args) {
  const inline = args.find((arg) => arg.startsWith('--release-version='));
  const release = inline?.slice('--release-version='.length).trim()
    || process.env.QA_RELEASE_VERSION?.trim()
    || null;
  if (!release) return null;
  if (release !== 'unassigned' && !/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(release)) {
    fail(`release historica invalida: ${release}`);
  }
  return release;
}

function grepFromTickets(tickets) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    fail('release historica sem tickets mapeados');
  }
  return tickets.map((ticket) => `@${ticket.toLowerCase()}`).join('|');
}

const args = process.argv.slice(2);
const scheduled = args.includes('--scheduled');
const explicit = args.find((arg) => !arg.startsWith('--'));
const suiteName = explicit
  || process.env.AUTOMATION_SUITE?.trim()
  || (scheduled ? suiteFromSchedule(process.env.GITHUB_EVENT_SCHEDULE?.trim()) : plan.defaultSuite);
const suite = plan.suites[suiteName];

if (!suite) {
  fail(`suite desconhecida '${suiteName}'. Opcoes: ${Object.keys(plan.suites).join(', ')}`);
}

const ticket = ticketFromEnv();
const historicalRelease = releaseFromContext(args);

if (ticket && historicalRelease) {
  fail('QA_TICKET_KEY e QA_RELEASE_VERSION/--release-version nao podem ser usados juntos');
}
if (historicalRelease && suiteName !== 'release') {
  fail('release historica deve ser executada pela suite release');
}

const historicalTickets = historicalRelease ? plan.releaseHistory?.[historicalRelease] : null;
if (historicalRelease && !historicalTickets) {
  fail(`release historica nao mapeada: ${historicalRelease}`);
}

const grep = ticket
  ? `@${ticket.toLowerCase()}`
  : historicalRelease
    ? grepFromTickets(historicalTickets)
    : suite.grep;

const selectedRelease = historicalRelease || plan.release;

if (args.includes('--show-plan')) {
  process.stdout.write(`${JSON.stringify({
    project: plan.project,
    release: selectedRelease,
    ...suite,
    selectedSuite: suiteName,
    selectedTicket: ticket,
    selectedHistoricalRelease: historicalRelease,
    selectedHistoricalTickets: historicalTickets,
    selectedGrep: grep,
  }, null, 2)}\n`);
  process.exit(0);
}

const playwrightArgs = ['test', '--grep', grep];
if (args.includes('--list')) playwrightArgs.push('--list');

const filtroTicket = ticket ? ` ticket=${ticket}` : '';
const filtroRelease = historicalRelease
  ? ` historicalRelease=${historicalRelease} tickets=${historicalTickets.join(',')}`
  : '';
const quantidade = ticket || historicalRelease ? 'filtered' : suite.expectedTests;
process.stdout.write(
  `[orchestrator] project=${plan.project} suite=${suiteName} release=${selectedRelease}${filtroTicket}${filtroRelease} grep=${grep} tests=${quantidade}\n`,
);

const playwrightCli = require.resolve('@playwright/test/cli');
const result = spawnSync(process.execPath, [playwrightCli, ...playwrightArgs], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: false,
});
if (result.error) fail(result.error.message);

if (!args.includes('--list')) {
  const qaResultScript = path.resolve(__dirname, 'support', 'playwright', 'qa-result.cjs');
  const qaResult = spawnSync(process.execPath, [qaResultScript], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });
  if (qaResult.error) fail(qaResult.error.message);
  if (qaResult.status !== 0) {
    process.stderr.write(`[orchestrator] falha ao gerar resultado estruturado: status=${qaResult.status}\n`);
    process.exit(qaResult.status ?? 1);
  }
}

process.exit(result.status ?? 1);
