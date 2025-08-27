/* eslint-disable @typescript-eslint/no-empty-function */
import { Application } from 'klayr-sdk';
import { AccountsModule } from "./modules/accounts/module";
import { CodaModule } from "./modules/coda/module";
import { PackageDataModule } from "./modules/package_data/module";
import { TrustfactsModule } from "./modules/trustfacts/module";

export const registerModules = (app: Application): void => {
    const accountsModule = new AccountsModule()
    app.registerModule(accountsModule);

    const packageDataModule = new PackageDataModule()
    app.registerModule(packageDataModule);

    const trustfactsModule = new TrustfactsModule()
    app.registerModule(trustfactsModule);

    const codaModule = new CodaModule();
    codaModule.addDependecies(accountsModule.method,packageDataModule.method, trustfactsModule.method);
    app.registerModule(codaModule);

    trustfactsModule.addDependecies(codaModule.method, accountsModule.method, packageDataModule.method);
};
