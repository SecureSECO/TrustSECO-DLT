import { Application } from 'klayr-sdk';
import { DashboardPlugin } from '@klayr/dashboard-plugin';

export const registerPlugins = (app: Application): void => {
    app.registerPlugin(new DashboardPlugin());
};
