import { BaseAsset } from 'lisk-sdk';

import { validFacts } from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    id = 26320; // coda-0
    name = 'AddJob';
    schema = {
        $id: 'coda/add-job',
        type: 'object',
        required: ["package", "source", "fact"],
        properties: {
            // package of the trustfact (e.g. "microsoft/terminal")
            package: {
                dataType: 'string',
                fieldNumber: 1
            },
            // source for the fact (e.g. "github")
            source: {
                dataType: 'string',
                fieldNumber: 2
            },
            // the type of fact (e.g. "stars")
            fact: {
                dataType: 'string',
                fieldNumber: 3
            }
        }
    };

    validate({asset}) {
        if (asset.package === "") throw new Error("Package id cannot be empty");
        if (!validFacts.hasOwnProperty(asset.source)) throw new Error("Invalid source");
        if (!validFacts[asset.source].includes(asset.fact)) throw new Error("Invalid fact for this source");
    };
    
    async apply(_) {
    // async apply({ asset, stateStore, reducerHandler, transaction }) {

        throw new Error('Asset "addToCoordinationDatabase" apply hook is not implemented.');

        // console.log(asset);

        // // Get sender account details
        // const senderAddress = transaction.senderAddress;
        // const senderAccount = await stateStore.account.get(senderAddress);
        // // Add the hello string to the sender account
        // senderAccount.hello.helloMessage = asset.helloString;
        // stateStore.account.set(senderAccount.address, senderAccount);
        // // Get the hello counter and decode it
        // let counterBuffer = await stateStore.chain.get(
        //     CHAIN_STATE_HELLO_COUNTER
        // );
        // let counter = codec.decode(
        //     helloCounterSchema,
        //     counterBuffer
        // );
        // // Increment the hello counter by +1
        // counter.helloCounter++;
        // // Save the updated counter on the chain
        // await stateStore.chain.set(
        //     CHAIN_STATE_HELLO_COUNTER,
        //     codec.encode(helloCounterSchema, counter)
        // );
    }
}

module.exports.CodaAddJobAsset = CodaAddJobAsset;