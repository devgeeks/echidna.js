import nacl from 'tweetnacl';
// import naclUtil from 'tweetnacl-util';
import {encode as encodeUTF8, decode as decodeUTF8} from '@stablelib/utf8';
import {decode as decodeBase64, encode as encodeBase64} from '@stablelib/base64';
import sha256 from 'fast-sha256';
import TransformPouch from 'transform-pouch';
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

// nacl.util = naclUtil;

function encrypt(text, nonce, key) {
  const encText = nacl.secretbox(encodeUTF8(text), nonce, key);
  return encodeBase64(encText);
}

function decrypt(text, nonce, key) {
  const decText = nacl.secretbox.open(decodeBase64(text), nonce, key);
  if (decText === null) {
    return undefined;
  }
  return decodeUTF8(decText);
}

export function generateNonce() {
  return nacl.randomBytes(24);
}

export function keyFromPassphrase(passphrase, salt, rounds = 100000) {
  const key = sha256.pbkdf2(encodeUTF8(passphrase), encodeUTF8(salt), rounds, 32);
  return key;
}

export default class Echidnajs {
  constructor({username, passphrase, salt, rounds = 100000}) {
    if (!username || !passphrase || !salt) {
      throw new Error('Missing required options');
      return false;
    }
    PouchDB.plugin(PouchDBFind);
    PouchDB.plugin(TransformPouch);
    const key = keyFromPassphrase(passphrase, salt, rounds);
    this.dbName = `echidnadb-${username}`;
    this.pouch = new PouchDB(this.dbName);
    this.pouch.transform({
      incoming(doc) {
        const keys = Object.keys(doc);
        const newDoc = {};
        const nonce = generateNonce();
        keys.forEach((field) => {
          if (field !== '_id' && field !== '_rev' && field !== 'nonce') {
            newDoc[field] = encrypt(doc[field], nonce, key);
          }
        });
        newDoc.nonce = encodeBase64(nonce);
        return Object.assign(doc, newDoc);
      },
      outgoing(doc) {
        const keys = Object.keys(doc);
        const newDoc = {};
        let error;
        keys.forEach((field) => {
          if (field !== '_id' && field !== '_rev' && field !== 'nonce') {
            newDoc[field] = decrypt(doc[field], decodeBase64(doc.nonce), key);
            if (newDoc[field] === undefined) {
              error = new Error('Failed to decrypt');
            }
          }
        });
        return error || Object.assign(doc, newDoc);
      },
    });
  }

  sync(...args) {
    this.remote = this.remote || new PouchDB(this.dbName);
    return this.remote.sync(...args);
  }

  hash(text) {
    const hash = nacl.hash(encodeUTF8(text));
    return encodeBase64(hash);
  }

  close() {
    this.remote.close();
    this.pouch.close();
    // console.log('closed');
  }
}
