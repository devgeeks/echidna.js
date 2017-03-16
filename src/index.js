import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import sha256 from 'fast-sha256';
import PouchDB from 'pouchdb-browser';
import TransformPouch from 'transform-pouch';

import 'babel-polyfill';

PouchDB.plugin(TransformPouch);
nacl.util = naclUtil;
window.naclUtil = naclUtil;
window.sha256 = sha256;

function encrypt(text, nonce, key) {
  const encText = nacl.secretbox(nacl.util.decodeUTF8(text), nonce, key);
  return nacl.util.encodeBase64(encText);
}

function decrypt(text, nonce, key) {
  const decText = nacl.secretbox.open(nacl.util.decodeBase64(text), nonce, key);
  if (decText === null) {
    return undefined;
  }
  return nacl.util.encodeUTF8(decText);
}

export function generateNonce() {
  return nacl.randomBytes(24);
}

export function keyFromPassphrase(passphrase, salt, rounds = 100000) {
  const key = sha256.pbkdf2(
    nacl.util.decodeUTF8(passphrase),
    nacl.util.decodeUTF8(salt),
    rounds, 32);
  return key;
}

export default class Echidnajs {
  constructor(username, passphrase, salt, rounds = 100000) {
    const key = keyFromPassphrase(passphrase, salt, rounds);
    this.pouch = new PouchDB(`echidnadb-${username}`);
    this.pouch.transform({
      incoming(doc) {
        // @TODO We NEED to check the passphrase is correct before adding or modifying any items
        const keys = Object.keys(doc);
        const newDoc = {};
        const nonce = generateNonce();
        // do something to the document before storage
        keys.forEach((field) => {
          if (field !== '_id' && field !== '_rev' && field !== 'nonce') {
            newDoc[field] = encrypt(doc[field], nonce, key);
          }
        });
        newDoc.nonce = nacl.util.encodeBase64(nonce);
        return Object.assign(doc, newDoc);
      },
      outgoing(doc) {
        const keys = Object.keys(doc);
        const newDoc = {};
        // do something to the document after retrieval
        let error;
        keys.forEach((field) => {
          if (field !== '_id' && field !== '_rev' && field !== 'nonce') {
            newDoc[field] = decrypt(doc[field], nacl.util.decodeBase64(doc.nonce), key);
            if (newDoc[field] === undefined) {
              error = new Error('Failed to decrypt');
            }
          }
        });
        return error || Object.assign(doc, newDoc);
      },
    });
  }
}
