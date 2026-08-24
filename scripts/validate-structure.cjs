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
const pastasFeatureProibidas = /\/(regressao|regression|smoke|release|releases|permissoes|permissions|tickets?)\//i;
for (const feature of features) {
  if (!featurePattern.test(feature)) errors.push(`feature fora da arquitetura por camada: ${feature}`);
  if (pastasFeatureProibidas.test(feature)) errors.push(`feature usa metadado como diretorio: ${feature}`);

  const camada = feature.split('/')[2];
  const conteudo = fs.readFileSync(path.join(root, feature), 'utf8');
  if (!conteudo.includes(`@${camada}`)) errors.push(`feature ${feature} nao declara a tag de camada @${camada}`);
}
if (!features.length) errors.push('nenhuma Feature encontrada em features/intelligence/{api,ui,bd}');

const steps = relativos.filter((arquivo) => arquivo.startsWith('steps/') && arquivo.endsWith('.steps.ts'));
const commonPattern = /^steps\/intelligence\/common\/.+\.steps\.ts$/;
const apiPattern = /^steps\/intelligence\/api\/(autenticar|buscar|consultar|escrever)\/[^/]+\.steps\.ts$/;
const uiPattern = /^steps\/intelligence\/ui\/[^/]+\/[^/]+\.steps\.ts$/;
const bdPattern = /^steps\/intelligence\/bd\/[^/]+\/(?:conexao|tabelas\/[^/]+)\.steps\.ts$/;
const pastasStepProibidas = /\/steps\/intelligence\/(?:api|ui|bd)\/(?:positivo|negativo|regressao|regression)\//i;

for (const step of steps) {
  const valido = commonPattern.test(step) || apiPattern.test(step) || uiPattern.test(step) || bdPattern.test(step);
  if (!valido) errors.push(`step fora da arquitetura por responsabilidade: ${step}`);
  if (pastasStepProibidas.test(`/${step}`)) errors.push(`step usa metadado como diretorio: ${step}`);
  if (/\/regressao\.steps\.ts$/i.test(step)) errors.push(`step generico de regressao nao permitido: ${step}`);
}
if (!steps.length) errors.push('nenhum Step Definition TypeScript encontrado');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'qa.project.json'), 'utf8'));
if (manifest.ranger) errors.push('schema Ranger invalido: use rangerBaseline, rangerProfiles e rangerSuites no topo do qa.project.json');
if (!manifest.rangerBaseline) errors.push('rangerBaseline ausente no qa.project.json');
for (const perfil of ['int100AdminFull', 'int100ViewOnly', 'int100NoAccess']) {
  if (!manifest.rangerProfiles?.[perfil]) errors.push(`Ranger profile ausente: ${perfil}`);
}
const fasesInt100 = manifest.rangerSuites?.int100Full?.phases;
if (!Array.isArray(fasesInt100) || fasesInt100.length !== 3) {
  errors.push('rangerSuites.int100Full precisa declarar exatamente 3 fases');
}
for (const capability of ['test100Admin', 'test100ViewOnly', 'test100NoAccess']) {
  if (!manifest.commands?.[capability]) errors.push(`capability Ranger ausente em commands: ${capability}`);
}

const plan = JSON.parse(fs.readFileSync(path.join(root, 'automation.plan.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github/workflows/automation.yml'), 'utf8');
for (const [name, suite] of Object.entries(plan.suites)) {
  if (suite.schedule && !workflow.includes(`cron: "${suite.schedule}"`)) {
    errors.push(`agenda da suite ${name} nao esta refletida no workflow`);
  }
}

if (errors.length) {
  console.error(errors.map((erro) => `- ${erro}`).join('\n'));
  process.exit(1);
}
console.log(
  `Estrutura valida: ${features.length} Features e ${steps.length} arquivos de Steps organizados por responsabilidade; Ranger INT-100 preservado; sem residuos legados.`,
);
