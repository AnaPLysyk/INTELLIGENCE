'use strict';

const fs = require('node:fs');
const path = require('node:path');

fs.mkdirSync(path.join(__dirname, 'reports', 'cucumber'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'test-results'), { recursive: true });

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      '.cucumber-dist/cucumber/world.js',
      '.cucumber-dist/cucumber/hooks.js',
      '.cucumber-dist/steps/**/*.steps.js'
    ],
    format: [
      'progress-bar',
      'summary',
      'json:test-results/cucumber.json',
      'html:reports/cucumber/cucumber.html'
    ],
    parallel: 1
  }
};
