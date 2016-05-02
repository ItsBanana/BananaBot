'use strict';

const pkg = require('../package');
const env = process.env;
const path = require('path');
const Bot = require('bananabot-base').Bot;
const PlaybackHelper = require('./Module/Music/Helper/PlaybackHelper');

try {
    let config = require('../config.json');

    env.DISCORD_ADMIN_ID = config.admin_id;
    env.DISCORD_AUTH_TOKEN = config.auth.token;
    env.DISCORD_AUTH_EMAIL = config.auth.email;
    env.DISCORD_AUTH_PASSWORD = config.auth.password;
    env.DISCORD_PREFIX = config.prefix;
    env.DISCORD_STATUS = config.status;
    env.DISCORD_MONGO_URL = config.mongo_url;
} catch (e) {
    console.log(e);
    console.log('Config file not found, falling back on environment variables.');
}

let options = {
    name: pkg.name,
    version: pkg.version,
    author: pkg.author,

    admin_id: env.DISCORD_ADMIN_ID,

    token: env.DISCORD_AUTH_TOKEN,
    email: env.DISCORD_AUTH_EMAIL,
    password: env.DISCORD_AUTH_PASSWORD,

    prefix: env.DISCORD_PREFIX,
    status: env.DISCORD_STATUS,

    mongo_url: env.DISCORD_MONGO_URL,

    modules: [
        require('./Module/Music/MusicModule')
    ],

    container: (Bot) => {
        return {
            parameters: {
                download_dir: path.join(__dirname, '../cache'),
                remove_after_skips: 5,
                volume: 20
            },
            services: {
                'helper.playback': {
                    module: PlaybackHelper,
                    args: [
                        '@dispatcher',
                        '@client',
                        '@logger',
                        '@brain.memory',
                        '%download_dir%',
                        '%volume%',
                        '%remove_after_skips%'
                    ]
                }
            }
        }
    }
};

new Bot('dev', true, options);