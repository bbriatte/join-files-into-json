'use strict';

const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const IncrementalVar = require('./incremental-var');

class JoinFileContents {

    static async fromConfigFile(file) {
        return JoinFileContents.usingConfig(JSON.parse((await readFile(file)).toString()));
    }

    static async usingConfig(config) {
        let res = {};
        if(config.from !== undefined) {
            try {
                res = JSON.parse((await readFile(config.from)).toString());
            } catch(err) { }
        }
        await Promise.all(config.inputs.map(async (input) => {
            let incrementalVar = undefined;
            const incrementalVarMatch = input.path.match(IncrementalVar.matchingRegex);
            if(incrementalVarMatch !== null) {
                incrementalVar = new IncrementalVar(incrementalVarMatch.toString());
            }
            try {
                do {
                    const data = await _readFileWithInput(input, incrementalVar);
                    _editObjectWithData(res, input, data, incrementalVar);
                    if(incrementalVar === undefined) {
                        return;
                    }
                    incrementalVar = incrementalVar.nextVar();
                } while (true);
            } catch(err) {
                if(err.code !== 'ENOENT') {
                    console.error(err);
                }
            }
        }));
        await writeFile(config.output, JSON.stringify(res, null, 2));
    }
}

function _readFileWithInput(input, iv) {
    let path = input.path;
    if(iv !== undefined) {
        path = path.replace(iv.key, iv.getPrettyVar());
    }
    return readFile(path);
}

function _editObjectWithData(obj, input, data, iv) {
    const fullKey = iv ? input.key.split(`{${iv.name}}`).join(iv.val) : input.key;
    const keys = fullKey.split('.');
    let parent = obj;
    for(let i = 0; i < keys.length - 1; i++) {
        let key = keys[i];
        let arrayIdx = undefined;
        const arrayStartIndex = key.indexOf('[');
        if(arrayStartIndex >= 0) {
            const arrayEndIndex = key.indexOf(']', arrayStartIndex);
            if(arrayEndIndex >= 0) {
                let realKey = key.substring(0, arrayStartIndex);
                const idxStr = key.substring(arrayStartIndex + 1, arrayEndIndex);
                arrayIdx = idxStr.length > 0 ? parseInt(idxStr) : -1;
                key = realKey;
            }
        }
        if(parent[key] === undefined) {
            parent[key] = arrayIdx === undefined ? {} : [];
        }
        parent = parent[key];
        if(arrayIdx !== undefined) {
            arrayIdx = arrayIdx >= 0 ? arrayIdx : parent.length;
            if(parent[arrayIdx] === undefined) {
                parent[arrayIdx] = {};
            }
            parent = parent[arrayIdx];
        }
    }
    parent[keys[keys.length - 1]] = data.toString().trim();
}

module.exports = JoinFileContents;