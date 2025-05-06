import { Application } from 'klayr-sdk';
import { DashboardPlugin } from "./plugins/dashboard/dashboard_plugin";

export const registerPlugins = (app: Application): void => {
    app.registerPlugin(new DashboardPlugin());
};
