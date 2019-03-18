'use strict';

const isMissingData = require('./validations').isMissingData;
// http://nodejs.org/api.html#_child_processes
const exec = require('child_process').exec;
/* 
# preparation
run_electrum daemon start
run_electrum daemon load_wallet
TODO test with btc hardware wallet
# ! means all balances except some fee
run_electrum payto <fixd_address> ! > payto.tx

node index.js
cli-app> seed
# remember to write down the seed <your_password> down
cli-app> address
# write down the address as <new_address>

compress iota_address 
add one more output tx with op_return lenth compact_iota into payto.tx

# to convert
cli-app> btc <new_address>

*/ 

const fixd_address = '15aNwb93g27y5iQJi1fxBohNKwEJgU8NRe';
const test_tx = '01000000011222221f835c2d5fdf7f735b959d3248decb056c9bf680c6cdaa5aedaa09b06d000000006b483045022100f7fc9b084c12dbfe331c0009e25a2aab655c81117d68769b6f9c42ab38643e4b022030983b0beff824c37fc94d14b6d394961f3a0028bb79e3d84cc6089427e45d9c4121034aeef8a60c8a2b60f72d9ea4d6c2ff49a8e2967edcb9e0f230c27fd069743114feffffff0280969800000000001976a91432308ba2af92b351cdf53e538c915771cb1e451988ac880805d30a0000001976a9149c227c4d2d789b8890411a2f6e1ea2756718d9ff88ac67880800';
const test_iota = 'YQATZQHEKWCSUGTMAFYCVEGAQXZNQOILMIH9GHAVHUTKZFRLWDSCMOEQWSTMCAQYHUIRRDCVQBRKJVFKXXRMQIWYDC';

const compress_tryte = (normal_tryte) => {
  let trit_array = '';
  for (let i=0;i<normal_tryte.length;i++){
    const tryte_a = normal_tryte.substr(i,1);
    if (tryte_a === '9') {
      trit_array+='000';
    } else {
      const tryte_n = 1+tryte_a.charCodeAt(0)-'A'.charCodeAt(0);
      trit_array+= Math.floor(tryte_n/9).toString();
      trit_array+= Math.floor((tryte_n%9)/3).toString();
      trit_array+= ((tryte_n%3)).toString();
    }
  }
  let compact_iota = '';
  for (let i=0;i<trit_array.length;i+=5){
    let n = 0;
    // 5 trit ex 22222 -> decimal 2*81+2*27+2*9+2*3+2
    for (let j=0;j<5;j++){
      const trit_n = parseInt(trit_array.substr(i+j,1));
      n = 3*n + trit_n;
    }
    // number 0-255 to hex string
    compact_iota += Math.floor(n/16).toString(16);
    compact_iota += (n%16).toString(16);
  }
  return compact_iota;
}

const decompress_tryte = (compact_s) => {
  let trit_array = '';
  for (let i=0;i<compact_s.length;i+=2) {
    const n = parseInt(compact_s.substr(i, 2),16);
    trit_array+= Math.floor(n/81).toString();
    trit_array+= Math.floor((n%81)/27).toString();
    trit_array+= Math.floor((n%27)/9).toString();
    trit_array+= Math.floor((n%9)/3).toString();
    trit_array+= ((n%3)).toString();
  }
  let normal_tryte = '';
  for (let i=0;i<trit_array.length;i+=3){
    const s = trit_array.substr(i,3);
    if (s==='000'){
      normal_tryte+='9';
    } else {
      let n = parseInt(s.substr(0,1)) * 9;
      n += parseInt(s.substr(1,1)) * 3;
      n += parseInt(s.substr(2,1));
      normal_tryte+=String.fromCharCode('A'.charCodeAt(0) + n-1);
    }
  }
  return normal_tryte;
}

const inject_data = (orig_tx, data) => {
  let new_tx = ''
  const in_count = parseInt(orig_tx.substr(4*2, 2), 16);
  let idx = 4+1;
  for (let i = 0; i < in_count; i++) {
    idx += 32 + 4;
    const len = parseInt(orig_tx.substr(idx*2, 2), 16);
    idx += 1 + len + 4;
  }
  const out_count = parseInt(orig_tx.substr(idx*2, 2), 16);
  new_tx = orig_tx.substr(0, idx*2);
  idx += 1;
  if (out_count < 15) {
    new_tx += '0';  
  }
  new_tx += (out_count+1).toString(16);
  // null_data tx with value 0
  new_tx += '0000000000000000';
  let len = Math.floor(data.length/2) + 1 + 1;
  // len op_return=6A data_len data, assume len >= 18
  new_tx += len.toString(16) + '6a';
  len -= 2;
  new_tx += len.toString(16) + data;

  new_tx += orig_tx.substr(idx*2, orig_tx.length-idx*2);
  return new_tx;
}

const setupBTCCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('bitcoin <address>', 'Move bitcoin to new address.')
    .alias('btc')
    .action((args, callback) => {
      const btc_program = "/home/a/Elymus/elymus"
      if (args.address !== 'test') {
        const compact_iota = compress_tryte(args.address);

        const cmd = btc_program + " payto " + fixd_address + ' 0.001';
        const child = exec(cmd, function (error, stdout, stderr) {
          const d = JSON.parse(stdout);
          vorpal.log(cmd);
          vorpal.log('result: ' + stdout);
          if (stderr !== null) {
            vorpal.log('error: ' + stderr);
          }
          const new_tx = inject_data(d.hex, compact_iota);
          const bcmd = btc_program + ' broadcast ' + new_tx;
          const child2 = exec(bcmd, function (error, stdout, stderr) {
            vorpal.log(bcmd);
            vorpal.log('result: ' + stdout);
            if (stderr !== null) {
              vorpal.log('error: ' + stderr);
            }             
          });
        });      
      } else {
        vorpal.log('addr '+test_iota);
        const compact_iota = compress_tryte(test_iota);
        vorpal.log('AZ9: '+decompress_tryte(compact_iota));
        const new_tx = inject_data(test_tx, compact_iota);
        vorpal.log(new_tx);
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
