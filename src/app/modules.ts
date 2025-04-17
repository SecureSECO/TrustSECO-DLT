/* eslint-disable @typescript-eslint/no-empty-function */
import { Application } from 'lisk-sdk';
import { AccountsModule } from "./modules/accounts/module";
import { PackageDataModule } from "./modules/package_data/module";

// @ts-expect-error app will have typescript error for unsued variable
export const registerModules = (app: Application): void => {
    app.registerModule(new AccountsModule());
    app.registerModule(new PackageDataModule());
};
