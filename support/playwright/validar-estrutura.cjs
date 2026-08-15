const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

function filesUnder(relativeDirectory) {
  const absolute = path.join(root, relativeDirectory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/'));
}

const errors = [];
const plan = JSON.parse(fs.readFileSync(path.join(root, 'automation.plan.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github/workflows/automation.yml'), 'utf8');
const testFiles = filesUnder('tests').filter((file) => file.endsWith('.ts'));
const testPattern = /^tests\/(api|ui|bd)\/([a-z0-9-]+)\/\2\.(positivo|negativo)\.\1\.spec\.ts$/;
const pairs = new Map();

for (const file of testFiles) {
  const match = file.match(testPattern);
  if (!match) {
    errors.push(`teste fora do padrao: ${file}`);
    continue;
  }
  const key = `${match[1]}/${match[2]}`;
  const natures = pairs.get(key) || new Set();
  natures.add(match[3]);
  pairs.set(key, natures);
}

for (const [key, natures] of pairs) {
  for (const nature of ['positivo', 'negativo']) {
    if (!natures.has(nature)) errors.push(`par ${key} sem arquivo ${nature}`);
  }
}

const supportFiles = filesUnder('support').filter((file) => file.endsWith('.ts'));
const supportPattern = /^support\/(config\/|functions\/(api|ui|bd|comum|provisionamento)\/|massas\/dados\/|playwright\/|global-setup\.ts$)/;
for (const file of supportFiles) {
  if (!supportPattern.test(file)) errors.push(`suporte fora da responsabilidade: ${file}`);
}

for (const [name, suite] of Object.entries(plan.suites)) {
  if (suite.schedule && !workflow.includes(`cron: "${suite.schedule}"`)) {
    errors.push(`agenda da suite ${name} nao esta refletida no workflow`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`Estrutura valida: ${testFiles.length} specs em ${pairs.size} pares; ${supportFiles.length} arquivos de suporte.\n`);
