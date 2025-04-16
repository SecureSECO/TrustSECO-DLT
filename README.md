# TrustSECO DLT

Prerequisites:
- [nvm](https://github.com/nvm-sh/nvm)  
  (or, if you so choose, manually install the required node version as specified in [`package.json`](./package.json) )

To get this running:

1. `git clone` this repo
2. `nvm use`
3. `npm install`
4. `./bin/run start` and profit!

# Safety

Note that in this development version; the master password for all delegate accounts is very weak, and stored in plain-text in the config.

# Getting Started with Lisk Blockchain Client

This project was bootstrapped with [Lisk SDK](https://github.com/LiskHQ/lisk-sdk)

### Start a node

```
./bin/run start
```

### Add a new module

```
lisk generate:module ModuleName
// Example
lisk generate:module token
```

### Add a new command

```
lisk generate:command ModuleName Command
// Example
lisk generate:command token transfer
```

### Add a new plugin

```
lisk generate:plugin PluginName
// Example
lisk generate:plugin httpAPI
```
