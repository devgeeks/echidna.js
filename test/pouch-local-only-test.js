var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
var sha256 = require('fast-sha256');
var book = require('./data').book;

var nonce = nacl.randomBytes(24);
var key = sha256.pbkdf2(
  'my totally secure passphrase',
  'this is a salty bugger',
  100000,
  32
);

var PouchDB = require('pouchdb');
PouchDB.plugin(require('transform-pouch'));

var pouch = new PouchDB('testlocal1');
var pouchAlt = new PouchDB('testlocal1');
var remoteCouch = false;

function encrypt(text) {
  const encText = nacl.secretbox(nacl.util.decodeUTF8(text), nonce, key);
  return nacl.util.encodeBase64(encText);
}

function decrypt(text) {
  const decText = nacl.secretbox.open(nacl.util.decodeBase64(text), nonce, key);
  return nacl.util.encodeUTF8(decText);
}

encrypt('this sucks');

pouch.transform({
  incoming: function (doc) {
    // do something to the document before storage
    Object.keys(doc).forEach(function (field) {
      if (field !== '_id' && field !== '_rev') {
        doc[field] = encrypt(doc[field]);
      }
    });
    return doc;
  },
  outgoing: function (doc) {
    // do something to the document after retrieval
    Object.keys(doc).forEach(function (field) {
      if (field !== '_id' && field !== '_rev') {
        doc[field] = decrypt(doc[field]);
      }
    });
    return doc;
  }
});

function addDoc(db, text) {
  var todo = {
    _id: 'test',
    title: text,
    completed: false
  };
  db.put(todo, function callback(err, result) {
    if (!err) {
      console.log('Successfully posted a todo!');
    }
  });
}

function showTodos(db) {
  db.allDocs({include_docs: true, descending: true}, function(err, doc) {
    console.log(doc.rows);
  });
}

pouch.changes({
  since: 'now',
  live: true
}).on('change', () => {
  showTodos(pouch);
  showTodos(pouchAlt);
});

addDoc(pouch, book);
