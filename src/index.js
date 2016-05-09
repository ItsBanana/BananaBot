'use strict';

const pkg = require('../package');
const env = process.env;
const Bot = require('./Bot');
const MusicHelper = require('./Module/Music/Helper/MusicHelper');
const PlaylistHelper = require('./Module/Music/Helper/PlaylistHelper');

try {
    let config = require('../config.json');

    env.CFG_DEBUG = config.debug;
    env.CFG_ADMIN_ID = config.admin_id;
    env.CFG_AUTH_TOKEN = config.auth.token;
    env.CFG_AUTH_EMAIL = config.auth.email;
    env.CFG_AUTH_PASSWORD = config.auth.password;
    env.CFG_PREFIX = config.prefix;
    env.CFG_STATUS = config.status;
    env.CFG_YOUTUBE_API_KEY = config.youtube_api_key;
    env.CFG_MONGO_URL = config.mongo_url;
} catch (e) {
    console.log(e);
    console.log('Config file not found, falling back on environment variables.');
}

let options = {
    name: pkg.name,
    version: pkg.version,
    author: pkg.author,

    debug: env.CFG_DEBUG === 'true',

    admin_id: env.CFG_ADMIN_ID,

    token: env.CFG_AUTH_TOKEN,
    email: env.CFG_AUTH_EMAIL,
    password: env.CFG_AUTH_PASSWORD,

    prefix: env.CFG_PREFIX,
    status: env.CFG_STATUS,

    mongo_url: env.CFG_MONGO_URL,

    modules: [
        require('./Module/Music/MusicModule')
    ],

    container: (Bot) => {
        return {
            parameters: {
                volume: 10,
                youtube_api_key: env.CFG_YOUTUBE_API_KEY
            },
            services: {
                'helper.music': {
                    module: MusicHelper,
                    args: [
                        '@container',
                        '@dispatcher',
                        '@client',
                        '@logger',
                        '@brain.memory',
                        '%volume%'
                    ]
                },
                'helper.playlist': {
                    module: PlaylistHelper,
                    args: [
                        '@container',
                        '@logger',
                        '@brain.memory',
                        '%youtube_api_key%'
                    ]
                }
            }
        }
    }
};

new Bot(options);