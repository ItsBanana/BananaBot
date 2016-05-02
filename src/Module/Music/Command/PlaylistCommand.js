'use strict';

const AbstractCommand = require('bananabot-base').AbstractCommand,
    Playlist = require('../Model/Playlist'),
    PER_PAGE = 15;

class PlaylistCommand extends AbstractCommand {
    static get name() {
        return 'playlist';
    }

    static get description() {
        return 'Shows information of the given playlists.';
    }

    static get help() {
        return '<playlist> [page] - The name of the playlist and the page.';
    }

    handle() {
        this.matches(/^playlist$/, () => {
            this.reply(PlaylistCommand.help);
        });

        this.matches(/^playlist ([\w\d_\-]+)\s?(\d+)?$/, matches => {
            let name = matches[1],
                page = matches[2] !== undefined ? parseInt(matches[2]) : 1;

            Playlist.findOne({ name: name }, (err, playlist) => {
                if (err) {
                    this.logger.error(err);
                }

                if (!playlist) {
                    return this.reply("Could not find playlist with that name.");
                }

                let message = `There are currently ${playlist.tracks.length} tracks in this playlist: \n`,
                    pages = playlist.tracks.length % PER_PAGE === 0
                        ? playlist.tracks.length / PER_PAGE
                        : Math.floor(playlist.tracks.length / PER_PAGE) + 1;

                if (pages > 1) {
                    message += `Page **${page} / ${pages}**:\n`;
                }

                message += "\n";

                let delay = 0;
                for (let index = PER_PAGE * (page - 1); index < (PER_PAGE * page); index++) {
                    let track = playlist.tracks[index], user;
                    if (track === undefined) {
                        break;
                    }

                    user = this.client.users.get('id', track.user);

                    if (message.length >= 1800) {
                        delay += 50;
                        this.reply(message, delay);
                        message = '';
                    }

                    message += `\`${index + 1}.\` **${track.name}** added by **${user.name}**\n`;
                }

                if (pages > 1) {
                    message += "\n";
                    if (page < pages) {
                        message += `To show the next page, type \`${this.prefix}playlist ${playlist.name} ${page + 1}\``;
                    }
                    if (page < pages && page > 1) {
                        message += "\n";
                    }
                    if (page > 1) {
                        message += `To show the previous page, type \`${this.prefix}playlist ${playlist.name} ${page - 1}\``;
                    }
                }
                message += "\n";

                setTimeout(() => {
                    this.reply(message);
                }, delay + 50);
            });
        })
    }
}

module.exports = PlaylistCommand;