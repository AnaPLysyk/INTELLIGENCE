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
const relativos = arquivos.map((arquivo) => path.relative(root, arquivo).replaceAll('\\', '/'));

for (const arquivo of arquivos) {
  const relativo = path.relative(root, arquivo).replaceAll('\\', '/');
  if (/\.spec\.ts$/i.test(relativo)) errors.push(`spec Playwright legado encontrado: ${relativo}`);
  if (relativo.endsWith('.feature') && fs.readFileSync(arquivo, 'utf8').includes('@pw-')) {
    errors.push(`feature ainda depende de bridge @pw: ${relativo}`);
  }
}

const features = relativos.filter((arquivo) => arquivo.startsWith('features/') && arquivo.endsWith('.feature'));
const featurePattern = /^features\/intelligence\/(api|ui|bd)\/.+\.feature$/;
const pastasProibidas = /\/(regressao|regression|smoke|release|releases|permissoes|permissions|tickets?)\//i;
for (const feature of features) {
  if (!featurePattern.test(feature)) errors.push(`feature fora da arquitetura por camada: ${feature}`);
  if (pastasProibidas.test(feature)) errors.push(`feature usa metadado como diretorio: ${feature}`);

  const camada = feature.split('/')[2];
  const conteudo = fs.readFileSync(path.join(root, feature), 'utf8');
  if (!conteudo.includes(`@${camada}`)) errors.push(`feature ${feature} nao declara a tag de camada @${camada}`);
}
if (!features.length) errors.push('nenhuma Feature encontrada em features/intelligence/{api,ui,bd}');

const steps = relativos.filter((arquivo) => arquivo.startsWith('steps/') && arquivo.endsWith('.steps.ts'));
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
console.log(`Estrutura valida: ${features.length} Features por camada/dominio e ${steps.length} arquivos de Steps; sem residuos legados.`);
