'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const errors = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.cucumber-dist', 'reports', 'test-results', 'test-data', 'playwright-report'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

for (const legado of ['support', 'tests', 'playwright.config.ts']) {
  if (fs.existsSync(path.join(root, legado))) errors.push(`residuo legado encontrado: ${legado}`);
}

const arquivos = walk(root);
for (const arquivo of arquivos) {
  const relativo = path.relative(root, arquivo).replaceAll('\\', '/');
  if (/\.spec\.ts$/i.test(relativo)) errors.push(`spec Playwright legado encontrado: ${relativo}`);
  if (relativo.endsWith('.feature') && fs.readFileSync(arquivo, 'utf8').includes('@pw-')) {
    errors.push(`feature ainda depende de bridge @pw: ${relativo}`);
  }
}

const steps = arquivos
  .map((arquivo) => path.relative(root, arquivo).replaceAll('\\', '/'))
  .filter((arquivo) => arquivo.startsWith('steps/') && arquivo.endsWith('.steps.ts'));
const stepPattern = /^steps\/intelligence\/(common\/.+|(?:api|ui|bd)\/(?:positivo|negativo)\/.+)\.steps\.ts$/;
for (const step of steps) if (!stepPattern.test(step)) errors.push(`step fora da arquitetura: ${step}`);
if (!steps.length) errors.push('nenhum Step Definition TypeScript encontrado');

const plan = JSON.parse(fs.readFileSync(path.join(root, 'automation.plan.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github/workflows/automation.yml'), 'utf8');
for (const [name, suite] of Object.entries(plan.suites)) {
  if (suite.schedule && !workflow.includes(`cron: "${suite.schedule}"`)) errors.push(`agenda da suite ${name} nao esta refletida no workflow`);
}

if (errors.length) {
  console.error(errors.map((erro) => `- ${erro}`).join('\n'));
  process.exit(1);
}
console.log(`Estrutura valida: ${steps.length} arquivos de Steps; sem support/, tests/, bridge ou .spec.ts.`);
