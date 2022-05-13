# Minimal Non-viable Product

Prerequisites:
- [nvm](https://github.com/nvm-sh/nvm)  
  (or, if you so choose, manually install the required node version as specified in [`package.json`](./package.json) )

To get this running:

1. `git clone` this repo
2. `nvm use`
3. `npm install`
4. In case you have ran an earlier version: `npm run reset` to get rid of the old blockchain.
5. `npm run start` and profit!

You should get connected to turtle and/or dove and/or other running instances. If your chain does _not_ start at block 0 you know it worked :D

# Config & Genesis Block

When necessary (f.e. after adding a module); the `npm run genesis` command can generate a new [`config/genesis-block.json`](./config/genesis-block.json) and update the delegate hashes in [`config/config.json`](./config/config.json) accordingly.

# Safety

Note that in this development version; the master password for all delegate accounts is very weak, and stored in plain-text in the config.
