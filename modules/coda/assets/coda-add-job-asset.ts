import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { PackageDataSchema, PackageData } from '../../packagedata/packagedata-schemas';
import { CodaJob, CodaJobList, minimalCodaJobSchema, codaJobListSchema, MinimalCodaJob} from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    static id = 26320;
    id = CodaAddJobAsset.id;
    name = 'AddJob';
    schema = minimalCodaJobSchema;

    validate({ asset }: ValidateAssetContext<MinimalCodaJob>) {
        asset = this.formatAsset({ asset });
        if (asset.package === "") throw new Error("Package cannot be empty");
        if (asset.version === "") throw new Error("version cannot be empty");
        if (asset.fact === "") throw new Error("Fact cannot be empty");
    }

    async apply({ asset, stateStore }: ApplyAssetContext<MinimalCodaJob>) {
        // Prevents users from adding duplicate jobs, differentiated by whitespaces
        asset = this.formatAsset({ asset });

        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        let { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        const currentDate = new Date();
        const job: CodaJob = {
            package: asset.package,
            version: asset.version,
            fact: asset.fact,
            date: currentDate.toString(),
            jobID: this.generateRandomNumber()
        }
        const duplicateIdCheck = jobs.filter(oldJob => oldJob.jobID == job.jobID).length > 0;
        while (duplicateIdCheck) {
            job.jobID = this.generateRandomNumber();
        }
        
        // Check if package is in packagedata and if version exist
        const packageDataBuffer = await stateStore.chain.get("packagedata:" + asset.package) as Buffer;
        if (packageDataBuffer === undefined) {
            throw new Error("The given package does not exist in the packageData!");
        }
        const packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
        const versionFound = packageData.packageReleases.some(version => {
            return asset.version == version;
        }); 

        if (!versionFound) {
            throw new Error("The given package version does not exist in the packageData!");
        } else if (jobs.filter(job => job.package == asset.package && 
            job.fact == asset.fact && job.version == asset.version).length > 0) {
            throw new Error("There already exists a job for the given package, version and fact!");
        }

        // If a job has been longer in the job list for a specified number of days, remove it
        jobs = jobs.filter(job => {
            const jobDate = new Date(job.date);
            const differenceInMilliSeconds = currentDate.getTime() - jobDate.getTime();
            const differenceInDays = Math.ceil(differenceInMilliSeconds / (1000 * 60 * 60 * 24));
            return differenceInDays <= 365;
        });

        // If the job list exceeds the maximum number of allowed jobs, remove the oldest ones (current jobs - number of allowed jobs).
        const maximumCodaJobs = 100000;
        if (jobs.length > maximumCodaJobs) {
            jobs.sort((jobOne, jobTwo) => {
                return new Date(jobOne.date).valueOf() - new Date(jobTwo.date).valueOf();
            });
            jobs.splice(0, jobs.length - maximumCodaJobs);
        }

        jobs.push(job);
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
    }

    formatAsset({ asset }) {
        asset.package = asset.package.trim();
        asset.package = asset.package.toLowerCase();
        asset.version = asset.version.trim();
        asset.version = asset.version.replace(/[^\d.-]/g, '');
        asset.fact = asset.fact.trim();
        asset.fact = asset.fact.toLowerCase();
        return asset;
    }

    generateRandomNumber() {
        return Math.floor(Math.random() * (Math.pow(2, 32) - 1));
    }
}
