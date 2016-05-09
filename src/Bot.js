'use strict';

const Base = require('bananabot-base').Bot;

class Bot extends Base {
    constructor(options) {
        super(options);

        // From https://github.com/meew0/Lethe/blob/master/lethe.js#L569 (ty bud)
        process.on('uncaughtException', function (err) {
            // Handle ECONNRESETs caused by the player and fixes #1
            if (err.code == 'ECONNRESET') {
                console.log('Got an ECONNRESET! This is *probably* not an error. Stacktrace:');
                console.log(err.stack);
            } else {
                // Normal error handling
                console.log(err);
                console.log(err.stack);
                process.exit(0);
            }
        });
    }
}

module.exports = Bot;