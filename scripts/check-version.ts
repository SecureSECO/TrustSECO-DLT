/*

Checks the version of this app against the version in the data (f.e. ~/.lisk/TrustSECO).
If a mismatch is detected, a prompt will be shown.

The environment variable RESET_ON_VERSION_MISMATCH can be set to true to uninteractively remove the data on detection of a mismatch.

*/

import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { systemDirs } from 'lisk-sdk';
import prompt = require('prompt');
import config from '../scripts/config-autofilled'

export async function checkVersion() {
    const { dataPath } = systemDirs(config.label as string, config.rootPath as string);
    const versionPath = `${dataPath}/.version`;

    const dataVersion = existsSync(versionPath) ? readFileSync(versionPath, 'utf8') : config.version;

    if (config.version != dataVersion) {

        console.log(`\n\nVersion mismatch detected!\n\tThe data in ${dataPath} is from version:\t${dataVersion}\tThe current version in config.json is:\t${config.version}.`);
        
        if (process.env.RESET_ON_VERSION_MISMATCH) {
            console.log(`Removing ${dataPath} ...`);
            rmSync(dataPath, { recursive: true });
        }
    
        else {
            prompt.start();
            const { confirmation } = await prompt.get({
                properties: {
                    confirmation: {
                        description: `You probably want to run \`npm run reset\` before continuing... Do you want to continue anyway? (y|n)`,
                        pattern: /^(y|n)$/,
                        message: 'Please confirm with `y` or cancel with `n`',
                        required: true
                    }
                }
            });
    
            if (confirmation === 'n') {
                console.log('Okay, goodbye!');
                throw new Error('Aborted');
            }
        }
    }

    mkdirSync(dataPath, { recursive: true });
    writeFileSync(versionPath, config.version as string);
}