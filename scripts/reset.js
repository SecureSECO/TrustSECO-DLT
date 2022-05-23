/* eslint-disable */

const config = require('../config/config.json');
const prompt = require('prompt');
const fs = require('fs');
const { systemDirs } = require('lisk-sdk');

const options = require('command-line-args')([
    { name: 'yes', alias: 'y', type: Boolean }
]);

const { dataPath } = systemDirs(config.label, config.rootPath);



if (!fs.existsSync(dataPath)) {
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
    fs.rmSync(dataPath, { recursive: true });
}
