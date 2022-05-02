import { BaseModule } from 'lisk-sdk';
const { CodaAddJobAsset } = require('./assets/coda-add-job-asset');

// import { validFacts } from './coda-schemas';

export class CodaModule extends BaseModule {
    id = 2632; // coda
    name = 'CodaModule';

    // actions = {}

    // events = {}

    transactionAssets = [ new CodaAddJobAsset() ];
 
    // Initialize the coordination database as an empty list
    // async afterGenesisBlockApply({genesisBlock, stateStore, reducerHandler}) {
    //     await stateStore.chain.set(
    //         "coda:jobs",
    //         codec.encode(helloCounterSchema, { helloCounter: 0 })
    //     );
    // }
}
