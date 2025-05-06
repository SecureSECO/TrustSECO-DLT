import { Plugins } from 'klayr-sdk';

 /* eslint-disable class-methods-use-this */
 /* eslint-disable  @typescript-eslint/no-empty-function */
 export class DashboardPlugin extends Plugins.BasePlugin {

	public name: 'dashboard';

	public get nodeModulePath(): string {
		return  __filename;
	}

	public async load(): Promise<void> {}

	public async unload(): Promise<void> {}
}
