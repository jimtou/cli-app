'use strict';

// http://nodejs.org/api.html#_child_processes
const exec = require('child_process').exec;
/* 
run_electrum daemon start
run_electrum daemon load_wallet
TODO test with btc hardware wallet
# ! means all balances except some fee
run_electrum payto <fixd_address> ! > payto.tx
cat payto.tx | run_electrum broadcast -

node index.js
cli-app> seed
# remember to write the seed <your_password> down
cli-app> address
# write down the address <iota_address>

run_electrum signmessage <your_address> <iota_address>
# write down the signature <signature>
cli-app>message-transfer <your_address> <iota_address> <signature>

TODO write the message-transfer function with hard-coded fixed_iota_address
   or just send via normal way.
*/ 

const setupBTCCommand = (data, vorpal) => {
  vorpal
    .command('bitcoin <subcmd>', 'Sets bitcoin.')
    .alias('btc')
    .action((args, callback) => {
      const btc_program = "/home/a/Elymus/elymus"
      if (args.subcmd === 'convert') {
        const cmd = btc_program + " getbalance"
        const child = exec(cmd, function (error, stdout, stderr) {
          const d = JSON.parse(stdout);
          vorpal.log('balance: ' + d.confirmed);
        });      
      } else {
        const cmd = btc_program + " getbalance"
        const child = exec(cmd, function (error, stdout, stderr) {
          const d = JSON.parse(stdout);
          vorpal.log('balance: ' + d.confirmed);
        });      
      } 
      callback();
    });
};

module.exports = setupBTCCommand;
