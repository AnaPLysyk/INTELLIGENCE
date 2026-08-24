'use strict';

const fs = require('node:fs');
const path = require('node:path');

const diretorioRelatorios = path.join(__dirname, 'reports', 'cucumber');
fs.mkdirSync(diretorioRelatorios, { recursive: true });

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['steps/**/*.steps.cjs'],
    format: [
      'progress-bar',
      'summary',
      'html:reports/cucumber/cucumber.html',
    ],
  },
};
