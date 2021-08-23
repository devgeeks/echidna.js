var EchidnaDB = require('../../lib').default;
var book = require('../data').book;

function Setup() {
  return new Promise((resolve, reject) => {
    var options = {
      username: 'myusername',
      passphrase: 'mypassphrase',
      salt: 'saltysaltysalty',
    };
    var echidna = new EchidnaDB(options);

    echidna.pouch
      .info()
      .then((result) => {
        console.log(result);
        console.time('encrypting book');
        echidna.pouch
          .put({
            _id: 'test',
            test: book,
          })
          .then((res) => {
            console.timeEnd('encrypting book');
            return resolve(res);
          })
          .catch((error) => reject(error));
      })
      .catch((error) => reject(error));
  });
}

module.exports = Setup;
