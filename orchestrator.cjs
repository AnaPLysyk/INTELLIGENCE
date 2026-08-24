'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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

const args = process.argv.slice(2);
const scheduled = args.includes('--scheduled');
const explicit = args.find((arg) => !arg.startsWith('--'));
const suiteName = explicit || process.env.AUTOMATION_SUITE?.trim()
  || (scheduled ? suiteFromSchedule(process.env.GITHUB_EVENT_SCHEDULE?.trim()) : plan.defaultSuite);
const suite = plan.suites[suiteName];
if (!suite) fail(`suite desconhecida '${suiteName}'. Opcoes: ${Object.keys(plan.suites).join(', ')}`);

const ticket = ticketFromEnv();
const historicalRelease = releaseFromContext(args);
if (ticket && historicalRelease) fail('QA_TICKET_KEY e QA_RELEASE_VERSION/--release-version nao podem ser usados juntos');
if (historicalRelease && suiteName !== 'release') fail('release historica deve ser executada pela suite release');
const historicalTickets = historicalRelease ? plan.releaseHistory?.[historicalRelease] : null;
if (historicalRelease && !historicalTickets) fail(`release historica nao mapeada: ${historicalRelease}`);

const tags = ticket
  ? `@${ticket.toLowerCase()}`
  : historicalRelease
    ? tagExpressionFromTickets(historicalTickets)
    : suite.grep;
const selectedRelease = historicalRelease || plan.release;

if (args.includes('--show-plan')) {
  console.log(JSON.stringify({
    project: plan.project,
    release: selectedRelease,
    ...suite,
    selectedSuite: suiteName,
    selectedTicket: ticket,
    selectedHistoricalRelease: historicalRelease,
    selectedHistoricalTickets: historicalTickets,
    selectedTags: tags,
  }, null, 2));
  process.exit(0);
}

build();
const cucumberCli = path.join(root, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
const cucumberArgs = [cucumberCli, '--config', 'cucumber.cjs', '--tags', tags];
if (args.includes('--list')) cucumberArgs.push('--dry-run', '--format', 'summary');

console.log(`[orchestrator] project=${plan.project} suite=${suiteName} release=${selectedRelease} tags=${tags} tests=${ticket || historicalRelease ? 'filtered' : suite.expectedTests}`);
const result = spawnSync(process.execPath, cucumberArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: false,
  env: process.env,
});
if (result.error) fail(result.error.message);

if (!args.includes('--list')) {
  const qa = spawnSync(process.execPath, [path.join(root, 'scripts', 'qa-result.cjs')], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });
  if (qa.error) fail(qa.error.message);
  if (qa.status !== 0) process.exit(qa.status ?? 1);
}
process.exit(result.status ?? 1);
