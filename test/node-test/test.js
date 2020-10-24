const rimraf = require('rimraf');
const EchidnaDB = require('../../lib').default;
const setup = require('./setup');

function error (error) {
    console.log(error);
    console.log('<< REMOVING TEST POUCH >>');
    rimraf('echidnadb-myusername', ()  => console.log('complete'));
}

setup()
.then(res => {
    const options = {
        username: 'myusername',
        passphrase: 'mypassphrase',
        salt: 'saltysaltysalty'
    };
    console.log('<< CREATING TEST POUCH >>');
    const echidna = new EchidnaDB(options);

    echidna.pouch.info()
    .then(result => {
        console.log(result);
        echidna.pouch.get('test')
        .then(res => {
            console.log(res);
            console.log('<< REMOVING TEST POUCH >>');
            rimraf('echidnadb-myusername', ()  => console.log('complete'));
        });
    });
})
.catch(error);