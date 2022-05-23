/* eslint-disable */

import { label, rootPath } from '../config/config.json';
import prompt from 'prompt';
import { existsSync, rmSync } from 'fs';
import { systemDirs } from 'lisk-sdk';

const options = require('command-line-args')([
    { name: 'yes', alias: 'y', type: Boolean }
]);

const { dataPath } = systemDirs(label, rootPath);

// throw error not implemented
if (rootPath === 'auto') {
    throw new Error('Reset script hasn\'t been implemented for auto rootPath. Wilco fix your things.');
}



if (!existsSync(dataPath)) {
    console.log(`${dataPath} does not exist. You probably already resetted :D`);
}



else if (options.yes) {
    reset();
}



else {
    prompt.start().get({
        properties: {
            confirmation: {
                description: `This will completely remove ${dataPath} Are you absolutely sure? (y|n)`,
                pattern: /^(y|n)$/,
                message: 'Please confirm with `y` or cancel with `n`',
                required: true
            }
        }
    }, (_, { confirmation }) => {

        if (confirmation === 'y') reset();
        else console.log('Okay, goodbye!');
    });
}



function reset() {
    console.log(`Removing ${dataPath} ...`);
    rmSync(dataPath, { recursive: true });
}
