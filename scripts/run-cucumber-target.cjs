'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, '.cucumber-dist');

function fail(message) {
  console.error(`[test-target] ${message}`);
  process.exit(2);
}

function relativeFromRoot(input) {
  const absolute = path.resolve(root, input);
  const relative = path.relative(root, absolute).replaceAll('\\', '/');
  if (relative.startsWith('../') || path.isAbsolute(relative)) fail(`alvo fora do projeto: ${input}`);
  return { absolute, relative };
}

function build() {
  fs.rmSync(dist, { recursive: true, force: true });
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

function escaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function executarCucumber(argumentos, options = {}) {
  const cucumberCli = path.join(root, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
  const args = [cucumberCli, '--config', 'cucumber.cjs', ...argumentos];
  if (options.dryRun) args.push('--dry-run');

  const env = { ...process.env };
  if (options.headed) env.PW_HEADLESS = 'false';

  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env,
  });
  if (result.error) fail(result.error.message);
  process.exit(result.status ?? 1);
}

function idsDoArquivoDeSteps(relative) {
  const compiled = path.join(dist, relative.replace(/\.ts$/i, '.js'));
  if (!fs.existsSync(compiled)) fail(`Step compilado nao encontrado: ${relative}`);

  const registryPath = path.join(dist, 'utils', 'common', 'case-registry.js');
  const registry = require(registryPath);
  require(compiled);

  const casos = registry.listarCasosRegistrados();
  if (!Array.isArray(casos) || casos.length === 0) {
    fail(`nenhum teste registrado em ${relative}`);
  }

  return casos.map((caso) => caso.id);
}

const [mode, target, ...flags] = process.argv.slice(2);
if (!mode || !target) {
  fail(
    'uso: node scripts/run-cucumber-target.cjs <feature|steps|case|tag> <alvo> [--dry-run] [--headed]',
  );
}

const dryRun = flags.includes('--dry-run');
const headed = flags.includes('--headed');
build();

if (mode === 'feature') {
  const { absolute, relative } = relativeFromRoot(target);
  if (!relative.startsWith('features/intelligence/') || !relative.endsWith('.feature')) {
    fail('feature deve estar em features/intelligence/**/*.feature');
  }
  if (!fs.existsSync(absolute)) fail(`Feature nao encontrada: ${relative}`);
  console.log(`[test-target] feature=${relative}`);
  executarCucumber([relative], { dryRun, headed });
}

if (mode === 'steps') {
  const { absolute, relative } = relativeFromRoot(target);
  if (!relative.startsWith('steps/intelligence/') || !relative.endsWith('.steps.ts')) {
    fail('arquivo deve estar em steps/intelligence/**/*.steps.ts');
  }
  if (relative.startsWith('steps/intelligence/common/')) {
    fail('steps/common contem glue compartilhado e nao representa uma suite executavel isolada');
  }
  if (!fs.existsSync(absolute)) fail(`arquivo de Steps nao encontrado: ${relative}`);

  const ids = idsDoArquivoDeSteps(relative);
  const regex = `(?:${ids.map(escaparRegex).join('|')})`;
  console.log(`[test-target] steps=${relative} casos=${ids.join(',')}`);
  executarCucumber(['--name', regex], { dryRun, headed });
}

if (mode === 'case') {
  const id = target.trim();
  if (!id) fail('informe o ID do caso');
  console.log(`[test-target] case=${id}`);
  executarCucumber(['--name', escaparRegex(id)], { dryRun, headed });
}

if (mode === 'tag') {
  const tag = target.trim();
  if (!tag) fail('informe a expressao de tags');
  console.log(`[test-target] tags=${tag}`);
  executarCucumber(['--tags', tag], { dryRun, headed });
}

fail(`modo desconhecido: ${mode}. Use feature, steps, case ou tag.`);
