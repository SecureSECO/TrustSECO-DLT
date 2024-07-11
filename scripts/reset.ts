import config from './config-autofilled';
import prompt = require('prompt');
import { existsSync, rmSync } from 'fs';
import { systemDirs } from 'lisk-sdk';

import cla = require('command-line-args');

const options = cla([
    { name: 'yes', alias: 'y', type: Boolean }
]);

const { dataPath } = systemDirs(config.label, config.rootPath);

if (!existsSync(dataPath)) {
    console.log(`${dataPath} does not exist. You probably already resetted :D`);
}

else if (options.yes) {
    reset();
}

else {
    prompt.start();
    prompt.get({
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

/*
This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
© Copyright Utrecht University (Department of Information and Computing Sciences)
*/