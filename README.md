# Minimal Non-viable Product

Prerequisites:
- node version v12.22.9 (exactly! check with `node -v`).  
  Make your life easier by using `nvm` to get the correct version.

To get this running:

1. `git clone` this repo
2. `npm install`
3. `node index.js` and profit!

You should get connected to turtle and/or dove and/or other running instances. If your chain does _not_ start at block 0 you know it worked :D

# Config & Genesis Block

When necessary (f.e. after adding a module); the `config/createGenesisBlock.js` script can generate a new `config/genesis-block.json` and update the delegate hashes in `config/config.json` accordingly.

# Safety

Note that the master password for all delegate accounts is very weak, and stored in plain-text in the config.

hallo