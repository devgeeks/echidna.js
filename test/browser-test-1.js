var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
var sha256 = require('fast-sha256');
var book = require('./data').book;

//console.time('start');
console.log('Starting timers...');
const startTime = new Date().getTime();
var nonce = nacl.randomBytes(24);
var key = sha256.pbkdf2(
  'my totally secure passphrase',
  'this is a salty bugger',
  100000,
  32
);

var completeKeyGen = (new Date().getTime() - startTime) / 1000;
console.log('completeGen', completeKeyGen);

var pouch; //, pouchAlt;
//document.addEventListener('load', function() {
  //console.log('device ready');
  var PouchDB = require('pouchdb');
  //PouchDB.plugin(require('pouchdb-adapter-cordova-sqlite'));
  PouchDB.plugin(require('transform-pouch'));

  pouch = new PouchDB('testlocal1');
  //pouchAlt = new PouchDB('testlocal1');

  var remoteCouch = false;

  console.log('newPouches', pouch);

  pouch.changes({
    since: 'now',
    live: true
  }).on('change', e => {
    //console.time('show');
    var startShow = new Date().getTime();
    showTodos(pouch);
    var completeShow1 = (new Date().getTime() - startShow) / 1000;
    console.log('show pouch (decrypt)', completeShow1);
    //console.timeEnd('show');
    //console.timeEnd('start');
    var completeShow2 = (new Date().getTime() - completeKeyGen - startTime) / 1000;
    console.log('all of it...', completeShow2);
    //showTodos(pouchAlt);
  });

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

  const todo = book; // 'test the browser at encryption';

  addDoc(pouch, todo);

  setTimeout(() => {
    pouch.destroy().then(function () {
      console.log('database destroyed');
    }).catch(function (err) {
      console.log('error occurred');
    })
  }, 30000);
//});

function encrypt(text) {
  const encText = nacl.secretbox(nacl.util.decodeUTF8(text), nonce, key);
  return nacl.util.encodeBase64(encText);
}

function decrypt(text) {
  const decText = nacl.secretbox.open(nacl.util.decodeBase64(text), nonce, key);
  return nacl.util.encodeUTF8(decText);
}

function addDoc(db, text) {
  var todo = {
    _id: 'testTodo',
    title: text,
    completed: false
  };
  db.put(todo, function callback(err, result) {
    if (err) {
      console.log('error: ', err);
      return;
    }
    console.log('Successfully posted a todo!');
  });
}

function showTodos(db) {
  db.allDocs({include_docs: true, descending: true}, function(err, doc) {
    console.log(doc.rows);
  });
}
