'use strict';

const AbstractCommand = require('bananabot-base').AbstractCommand,
      Playlist = require('../Model/Playlist');

class PlaylistsCommand extends AbstractCommand {
    static get name() {
        return 'playlists';
    }

    static get description() {
        return 'Shows information of all playlists.';
    }

    handle() {
        this.matches(/^playlists$/, () => {
            Playlist.find({}, (err, playlists) => {
                if (err) {
                    this.logger.error(err);
                }

                if (playlists.length === 0) {
                    return this.reply("There are currently no playlists.");
                }

                let message = `There ${playlists.length > 1 ? 'are' : 'is'} currently ${playlists.length} ${playlists.length > 1 ? 'playlists' : 'playlist'}: \n\n`;
                let delay = 0;
                playlists.forEach((playlist, index) => {
                    let user = this.client.users.get('id', playlist.user);

                    if (message.length >= 1800) {
                        delay += 50;
                        this.sendMessage(this.message.channel, message, delay);
                        message = '';
                    }

                    message += `\`${index + 1}.\` **${playlist.name}** by **${user.name}** - ${playlist.tracks.length} ${playlist.tracks.length > 1 || playlist.tracks.length < 1 ? 'tracks' : 'track'}\n`;
                });

                setTimeout(() => {
                    this.reply(message);
                }, delay + 50);
            });
        });
    }
}

module.exports = PlaylistsCommand;