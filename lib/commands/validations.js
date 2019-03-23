'use strict';

const chalk = require('chalk');

let data, vorpal;

const setupValidators = (d, v) => {
  data = d;
  vorpal = v;
};

const isMissingData = (list) => {
  if (list.indexOf('node') !== -1 && !data.currentNodeInfo) {
    vorpal.log(chalk.red('It looks like you are not connected to an BCC node.  Try "node".\n'));
    return true;
  }

  if (list.indexOf('seed') !== -1 && !data.seed) {
    vorpal.log(chalk.red('Please set a seed first with the "seed" command.\n'));
    return true;
  }

  if (list.indexOf('accountData') !== -1 && !data.accountData) {
    vorpal.log(chalk.red('We are still retrieving account data.  Try again in a few seconds.\n'));
    return true;
  }

  return false;
};

module.exports = {
  isMissingData,
  setupValidators
};
