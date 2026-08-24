'use strict';

const fs = require('node:fs');
const path = require('node:path');

function limparCucumberDist(root = path.resolve(__dirname, '..')) {
  fs.rmSync(path.join(root, '.cucumber-dist'), { recursive: true, force: true });
}

if (require.main === module) {
  limparCucumberDist();
  console.log('[cucumber] .cucumber-dist limpo');
}

module.exports = { limparCucumberDist };
