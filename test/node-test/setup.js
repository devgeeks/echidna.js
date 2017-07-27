var EchidnaDB = require('../../lib').default;

function Setup() {
    return new Promise((resolve, reject) => {
        var options = {
            username: 'myusername',
            passphrase: 'mypassphrase',
            salt: 'saltysaltysalty'
        };
        var echidna = new EchidnaDB(options);

        echidna.pouch.info()
        .then(result => {
            console.log(result);
            echidna.pouch.put({
                _id: 'test',
                test: 'testdata'
            })
            .then(res => resolve(res))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
}

module.exports = Setup;