'use strict';

const isMissingData = require('./validations').isMissingData;
const chalk = require('chalk');

let elapsedInterval;

const setupTransferCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('transfer <address> <value>', 'Sends bccs to the address')

    .action((args, callback) => {
      if (isMissingData(['node', 'seed'])) {
        return callback();
      }

      // covert back to G level decimal, invalid amount 0.0000000001
      // valid minimal amount 0.000000001
      const amount = parseFloat(args.value) * 1000000000;
      if (amount !== parseInt(amount)) {
        vorpal.log(chalk.red('Please provide a valid bcc amount'));
        return callback();
      }
      if (amount === 0) {
        vorpal.log(chalk.red('The value is zero'));
      }
      

      if (args.address.length === 90 && !iotajs.utils.isValidChecksum(args.address)) {
        vorpal.log(chalk.red('That address appears malformed.  Please check it.'));
        return callback();
      }

      const address = args.address.length === 81
        ? iotajs.utils.addChecksum(args.address)
        : args.address;

      vorpal.log('One moment while the transfer is made.  This can take a few minutes.');
      const start = Date.now();
      elapsedInterval = setInterval(() => {
        process.stdout.write(`You've been waiting ${Math.floor((Date.now() - start)/1000)}s\r`);
      });

      const transfers = [{
        address,
        'value': parseInt(args.value),
        'message': iotajs.utils.toTrytes(''),
        'tag': '',
	'obsoleteTag' : ''
      }];

      iotajs.api.sendTransfer(data.seed, data.depth, data.minWeightMagnitude, transfers, (err) => {
        if (elapsedInterval) {
          clearInterval(elapsedInterval);
          if (err) {
            vorpal.log(chalk.red(err), '                   \n'); // extra spaces to cover elapsed
            return callback();
          }

          vorpal.log(chalk.green('Transfer complete!                \n')); // extra spaces to cover elapsed
        }
        callback();
      });
    })

    .cancel(() => {
      clearInterval(elapsedInterval);
      iotajs.api.interruptAttachingToTangle(() => {});
      vorpal.log(chalk.red('transfer cancelled\n'));
    });
};

module.exports = setupTransferCommand;
