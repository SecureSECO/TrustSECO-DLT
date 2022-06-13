import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { CodaJobList, codaJobListSchema } from '../../coda/coda-schemas';
import { Signed, SignedSchema } from '../../signed-schemas';
import { AddTrustFact, StoreTrustFact, TrustFactList, AddTrustFactSchema, TrustFactListSchema } from '../trustfacts_schema';
import { spawnSync } from 'child_process';
import { unlink, writeFileSync } from 'fs';

export class TrustFactsAddFactAsset extends BaseAsset {
    id = 32280;
    name = 'AddFacts';
    schema = SignedSchema(AddTrustFactSchema);

    validate({ asset }: ValidateAssetContext<Signed<AddTrustFact>>) {
        if (asset.data.jobID < 0) throw new Error("JobID can't be negative");
        if (asset.data.factData.trim() === "") throw new Error("FactData cannot be empty");

        if (!asset.signature) throw new Error("Signature is missing!");

        //---start of gpg verification---
        // generate random number that identifies this gpg verification
        const random = Math.random().toString().slice(2);
        // write asset.signature to file
        writeFileSync("/tmp/signature-" + random, asset.signature);
        const encoded = codec.encode(AddTrustFactSchema, asset.data);
        // write data to fle
        writeFileSync("/tmp/data-" + random, encoded);

        // verify signature        
        const result = spawnSync(`gpg`, ["--verify", "/tmp/signature-" + random, "/tmp/data-" + random]);

        // delete the files
        unlink("/tmp/signature-" + random, () => 0);
        unlink("/tmp/data-" + random, () => 0);

        // extract the key
        const regex = /key \w*(\w{16})/;        
        const accountUid = regex.exec(result.stderr?.toString())?.[1];

        // if there is no key, the verification failed
        if (accountUid == null) {throw new Error("gpg verification failed");}
        //---end of gpg verification---
    }

    async apply({ asset, stateStore }: ApplyAssetContext<Signed<AddTrustFact>>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        const job = jobs.find(job => job.jobID === asset.data.jobID);

        if (job !== undefined) {
            // get the facts for this package
            let facts: StoreTrustFact[] = [];

            const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + job.package);
            if (trustFactsBuffer !== undefined) {
                facts = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer).facts;
            }

            //---start of gpg verification (for accountUid extraction)---
            // generate random number that identifies this gpg verification
            const random = Math.random().toString().slice(2);
            // write asset.signature to file
            writeFileSync("/tmp/signature-" + random, asset.signature);
            const encoded = codec.encode(AddTrustFactSchema, asset.data);
            // write data to fle
            writeFileSync("/tmp/data-" + random, encoded);

            // verify signature        
            const result = spawnSync(`gpg`, ["--verify", "/tmp/signature-" + random, "/tmp/data-" + random]);

            // delete the files
            unlink("/tmp/signature-" + random, () => 0);
            unlink("/tmp/data-" + random, () => 0);

            // extract the key
            const regex = /key \w*(\w{16})/;
            const accountUid = regex.exec(result.stderr?.toString())?.[1];

            // if there is no key, the verification failed
            if (accountUid == null) { throw new Error("accountUid (for gpg verification) is null"); } // redundant?
            //---end of gpg verification---

            // check if this account already has a fact for this job
            const existingFact = facts.find(fact => fact.account.uid === accountUid && fact.jobID === asset.data.jobID);
            if (existingFact !== undefined) throw new Error("Account already has a fact for this job");

            const newFact: StoreTrustFact = { 
                fact: job.fact, 
                factData: asset.data.factData, 
                version: job.version, 
                keyURL: asset.data.keyURL, 
                jobID: asset.data.jobID,
                account: { uid: accountUid }
            };
            facts.push(newFact);

            await stateStore.chain.set("trustfacts:" + job.package, codec.encode(TrustFactListSchema, { facts }));
        } else {
            throw new Error("Job with given job ID does not exist!");
        }
    }
}