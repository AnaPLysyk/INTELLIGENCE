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

function tagsAntesDoCenario(linhas, indice) {
  const tags = [];
  for (let i = indice - 1; i >= 0; i -= 1) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    if (!linha.startsWith('@')) break;
    tags.unshift(...linha.split(/\s+/).filter((tag) => tag.startsWith('@')));
  }
  return tags;
}

function passosDoCenario(linhas, inicio) {
  const passos = [];
  for (let i = inicio + 1; i < linhas.length; i += 1) {
    const linha = linhas[i].trim();
    if (/^(Cenário|Cenario|Scenario|Esquema do Cenário|Esquema do Cenario|Scenario Outline):/i.test(linha)) break;
    const match = linha.match(/^(Dado|Quando|Então|Entao|E|Mas)\s+(.+)$/i);
    if (match) passos.push({ keyword: match[1], texto: match[2] });
  }
  return passos;
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
const casesEncontrados = new Map();
const passosGenericosProibidos = [
  'que o caso automatizado está preparado',
  'executo o comportamento automatizado do caso',
  'o contrato automatizado deve ser atendido',
];

for (const feature of features) {
  if (!featurePattern.test(feature)) errors.push(`feature fora da arquitetura por camada: ${feature}`);
  if (pastasFeatureProibidas.test(feature)) errors.push(`feature usa metadado como diretorio: ${feature}`);

  const camada = feature.split('/')[2];
  const conteudo = fs.readFileSync(path.join(root, feature), 'utf8');
  const linhas = conteudo.split(/\r?\n/);

  if (!conteudo.includes(`@${camada}`)) errors.push(`feature ${feature} nao declara a tag de camada @${camada}`);
  if (!/^\s*Funcionalidade:/mu.test(conteudo)) errors.push(`feature sem titulo de Funcionalidade: ${feature}`);
  for (const narrativa of ['Como ', 'Quero ', 'Para ']) {
    if (!linhas.some((linha) => linha.trimStart().startsWith(narrativa))) {
      errors.push(`feature ${feature} sem narrativa BDD '${narrativa.trim()}'`);
    }
  }

  if (/Esquema do Cenário:|Esquema do Cenario:|Scenario Outline:/i.test(conteudo)) {
    errors.push(`feature ainda usa Scenario Outline/Esquema generico: ${feature}`);
  }

  for (const frase of passosGenericosProibidos) {
    if (conteudo.includes(frase)) errors.push(`feature ${feature} ainda usa passo generico: ${frase}`);
  }
  if (/que o caso\s+"<id>"\s+está preparado/i.test(conteudo)) {
    errors.push(`feature ${feature} ainda usa identificacao generica por <id>`);
  }

  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i].trim();
    const cenario = linha.match(/^(?:Cenário|Cenario|Scenario):\s*(.+)$/i);
    if (!cenario) continue;

    const titulo = cenario[1].trim();
    if (titulo.length < 8) errors.push(`cenario com titulo pouco descritivo em ${feature}:${i + 1}: ${titulo}`);

    const tags = tagsAntesDoCenario(linhas, i);
    const caseTags = tags.filter((tag) => tag.startsWith('@case-'));
    if (caseTags.length !== 1) {
      errors.push(`cenario ${feature}:${i + 1} precisa de exatamente um @case-<ID>; encontrados=${caseTags.length}`);
    } else {
      const caseId = caseTags[0].slice('@case-'.length);
      const anterior = casesEncontrados.get(caseId);
      if (anterior) errors.push(`@case-${caseId} duplicado: ${anterior} e ${feature}:${i + 1}`);
      else casesEncontrados.set(caseId, `${feature}:${i + 1}`);
    }

    const passos = passosDoCenario(linhas, i);
    let principal;
    const papeis = new Set();
    for (const passo of passos) {
      const keyword = passo.keyword.toLowerCase();
      if (keyword === 'dado') principal = 'dado';
      else if (keyword === 'quando') principal = 'quando';
      else if (keyword === 'então' || keyword === 'entao') principal = 'entao';
      if (principal) papeis.add(principal);
    }
    for (const papel of ['dado', 'quando', 'entao']) {
      if (!papeis.has(papel)) errors.push(`cenario ${feature}:${i + 1} sem passo principal ${papel.toUpperCase()}`);
    }
  }
}
if (!features.length) errors.push('nenhuma Feature encontrada em features/intelligence/{api,ui,bd}');

const steps = relativos.filter((arquivo) => arquivo.startsWith('steps/') && arquivo.endsWith('.steps.ts'));
const commonPattern = /^steps\/intelligence\/common\/.+\.steps\.ts$/;
const apiPattern = /^steps\/intelligence\/api\/(autenticar|buscar|consultar|escrever)\/[^/]+\.steps\.ts$/;
const uiPattern = /^steps\/intelligence\/ui\/[^/]+\/[^/]+\.steps\.ts$/;
const bdPattern = /^steps\/intelligence\/bd\/[^/]+\/(?:conexao|tabelas\/[^/]+)\.steps\.ts$/;
const pastasStepProibidas = /\/steps\/intelligence\/(?:api|ui|bd)\/(?:positivo|negativo|regressao|regression)\//i;
const casosRegistrados = new Map();

for (const step of steps) {
  const valido = commonPattern.test(step) || apiPattern.test(step) || uiPattern.test(step) || bdPattern.test(step);
  if (!valido) errors.push(`step fora da arquitetura por responsabilidade: ${step}`);
  if (pastasStepProibidas.test(`/${step}`)) errors.push(`step usa metadado como diretorio: ${step}`);
  if (/\/regressao\.steps\.ts$/i.test(step)) errors.push(`step generico de regressao nao permitido: ${step}`);

  const conteudo = fs.readFileSync(path.join(root, step), 'utf8');
  const regexCaso = /\b(?:registrarCaso|teste)\(\s*['"]([^'"]+)['"]/g;
  for (const match of conteudo.matchAll(regexCaso)) {
    const caseId = match[1].trim();
    const anterior = casosRegistrados.get(caseId);
    if (anterior) errors.push(`caso executavel ${caseId} registrado mais de uma vez: ${anterior} e ${step}`);
    else casosRegistrados.set(caseId, step);
  }
}
if (!steps.length) errors.push('nenhum Step Definition TypeScript encontrado');

for (const [caseId, origemFeature] of casesEncontrados) {
  if (!casosRegistrados.has(caseId)) {
    errors.push(`@case-${caseId} nao possui implementacao executavel em Steps: ${origemFeature}`);
  }
}
for (const [caseId, origemStep] of casosRegistrados) {
  if (!casesEncontrados.has(caseId)) {
    errors.push(`caso executavel ${caseId} ficou orfao sem Feature BDD: ${origemStep}`);
  }
}

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
  `Estrutura valida: ${features.length} Features, ${casesEncontrados.size} cenarios BDD com @case unico, ${casosRegistrados.size} casos executaveis e ${steps.length} arquivos de Steps; Ranger INT-100 preservado; sem residuos legados.`,
);
