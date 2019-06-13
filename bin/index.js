#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const JoinFileContent = require('../join-file-contents');

const options = [
    {
        name: 'confPath',
        alias: 'c',
        type: String,
        defaultOption: true,
    }
];
const cla = commandLineArgs(options);
JoinFileContent.fromConfigFile(cla.confPath).catch(console.error);