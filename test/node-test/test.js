var rimraf = require('rimraf');
var EchidnaDB = require('../../lib').default;
var setup = require('./setup');

function error (error) {
    console.log(error);
    rimraf('echidnadb-myusername', ()  => console.log('complete'));
}

setup()
.then(res => {
    var options = {
        username: 'myusername',
        passphrase: 'mypassphrase',
        salt: 'saltysaltysalty'
    };
    var echidna = new EchidnaDB(options);

    echidna.pouch.info()
    .then(result => {
        console.log(result);
        echidna.pouch.get('test')
        .then(res => {
            console.log(res);
            rimraf('echidnadb-myusername', ()  => console.log('complete'));
        })
        .catch(error);
    })
    .catch(error);
})
.catch(error);