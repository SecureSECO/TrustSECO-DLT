import { TokenModule, DPoSModule, KeysModule, SequenceModule, BaseModule } from 'lisk-sdk';
import config = require('./config.json');

import { CodaModule } from '../modules/coda/coda-module';
import { TrustFactsModule } from '../modules/trustfacts/trustfacts_module';
import { PackageDataModule} from '../modules/packagedata/packagedata-module';
import { AccountsModule } from '../modules/accounts/accounts-module';

export const modules : BaseModule[] = [
    // Default Modules
    new TokenModule(config.genesisConfig),
    new DPoSModule(config.genesisConfig),
    new KeysModule(config.genesisConfig),
    new SequenceModule(config.genesisConfig),

    // ADD ALL MODULES HERE
    // (don't forget to import them)

    new CodaModule(config.genesisConfig),
    new TrustFactsModule(config.genesisConfig),
    new PackageDataModule(config.genesisConfig),
    new AccountsModule(config.genesisConfig),
]