'use strict';

// http://nodejs.org/api.html#_child_processes
const exec = require('child_process').exec;

const setupBTCCommand = (data, vorpal) => {
  vorpal
    .command('bitcoin <mwm>', 'Sets bitcoin.')
    .alias('btc')
    .action((args, callback) => {
      data.minWeightMagnitude = args.mwm;
      const cmd = "/home/a/Elymus/elymus getbalance"
      // TODO check daemon start
      // daemon load wallet
      // test with btc hardware wallet
      // payto fix_address balance - fee -> output tx = output["hex"]
      // ? check whether payto already signed, signtransaction tx
      // broadcast tx
      // TODO check where to insert iota address?
      const child = exec(cmd, function (error, stdout, stderr) {
        const d = JSON.parse(stdout);
        vorpal.log('balance: ' + d.confirmed);
        if (stderr != null) {
          vorpal.log('stderr: ' + stderr);
        } 
        if (error !== null) {
          vorpal.log('exec error: ' + error);
        }
      });      
      callback();
    });
};

module.exports = setupBTCCommand;
