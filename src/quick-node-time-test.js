var book = require('./data').book;
var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
var sha256 = require('fast-sha256');

var message = 'This is a super secret message. shhhhhh.';

console.time('key');
var key = sha256.pbkdf2(
  'my totally secure passphrase',
  'this is a salty bugger',
  100000,
  32
);
console.timeEnd('key');

console.time('encrypt');
var nonce = nacl.randomBytes(24);
var box = nacl.secretbox(nacl.util.decodeUTF8(message), nonce, key);
console.timeEnd('encrypt');

console.log(nacl.util.encodeBase64(key));
console.log(nacl.util.encodeBase64(nonce));
console.log(nacl.util.encodeBase64(box));

console.time('Encrypt Thomas Paine Books');
nonce = nacl.randomBytes(24);
box = nacl.secretbox(nacl.util.decodeUTF8(book), nonce, key);
console.timeEnd('Encrypt Thomas Paine Books');
console.log('\nNow thats a lot of data!');
