'use strict';

const AbstractModule = require('bananabot-base').AbstractModule;

class MusicModule extends AbstractModule {
    get commandsDir() { return __dirname + '/Command'; }
}

module.exports = MusicModule;