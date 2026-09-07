// Run inside the ledger container: node /tmp/gpg-registration.cjs
const assert = require('node:assert/strict');
const pgp = require('openpgp');
const axios = require('axios');
const { import_: importKey } = require('../dist/app/common/gpg-verification');
(async () => {
 const first = await pgp.generateKey({type:'ecc',curve:'ed25519Legacy',userIDs:[{name:'Old key'}],date:new Date('2020-01-01'),keyExpirationTime:60});
 const second = await pgp.generateKey({type:'ecc',curve:'ed25519Legacy',userIDs:[{name:'Current key'}]});
 const selected = await pgp.readKey({armoredKey:second.publicKey});
 axios.get = async () => ({data:first.publicKey + '\n' + second.publicKey});
 const result = await importKey('https://github.com/example.gpg', selected.getFingerprint().toUpperCase());
 assert.equal(result.uid, selected.getKeyID().toHex().toUpperCase());
 assert.equal((await pgp.readKeys({armoredKeys:result.key})).length, 1);
 assert.equal((await pgp.readKey({armoredKey:result.key})).getFingerprint(), selected.getFingerprint());
 await assert.rejects(importKey('https://github.com/example.gpg', '0'.repeat(40)), /not published/);
 await assert.rejects(importKey('https://example.com/example.gpg'), /not a GitHub/);
 axios.get = async () => ({data:second.publicKey});
 assert.equal((await importKey('https://github.com/example.gpg')).uid,result.uid);
 axios.get = async () => ({data:'invalid'});
 await assert.rejects(importKey('https://github.com/example.gpg'));
 console.log('PASS: selected second key after expired key; export one key; missing fingerprint; invalid URL; legacy single key; malformed keys');
})().catch(e=>{ console.error(e.message); process.exit(1); });
