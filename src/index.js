'use strict';

const pkg = require('../package');
const env = process.env;
const path = require('path');
const Bot = require('bananabot-base').Bot;
const MusicHelper = require('./Module/Music/Helper/MusicHelper');
const PlaylistHelper = require('./Module/Music/Helper/PlaylistHelper');

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
                remove_after_skips: 5,
                volume: 10,
                youtube_api_key: 'AIzaSyDdmViX4so3V7lYsxAZuON0jaCEbqIjkEw'
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
                        '%volume%',
                        '%remove_after_skips%'
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

new Bot('dev', true, options);