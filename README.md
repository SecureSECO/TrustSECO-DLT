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

# Getting Started with Klayr Blockchain Client

This project was bootstrapped with [Klayr SDK](https://github.com/KlayrHQ/klayr-sdk)

### Start a node

```
./bin/run start
```

### Add a new module

```
klayr generate:module ModuleName
// Example
klayr generate:module token
```

### Add a new command

```
klayr generate:command ModuleName Command
// Example
klayr generate:command token transfer
```

### Add a new plugin

```
klayr generate:plugin PluginName
// Example
klayr generate:plugin httpAPI
```
