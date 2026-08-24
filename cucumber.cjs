'use strict';

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['steps/**/*.steps.cjs'],
    format: ['progress-bar', 'summary'],
  },
};
