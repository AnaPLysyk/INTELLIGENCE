'use strict';

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['steps/**/*.steps.cjs'],
    publishQuiet: true,
    format: ['progress-bar', 'summary'],
  },
};
