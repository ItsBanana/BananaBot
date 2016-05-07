'use strict';

const AbstractCommand = require('../AbstractCommand'),
      Playlist = require('../Model/Playlist');

class RemoveCommand extends AbstractCommand {
    static get name() {
        return 'remove';
    }

    static get description() {
        return 'Removes a playlist, or a track from a playlist.';
    }

    static get help() {
        return '<playlist> [track index] - The name of the playlist you want to remove, incase you want to remove a track also pass the track index.';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^remove$/, () => {
            this.reply(RemoveCommand.help);
        });

        this.matches(/^remove ([\w\d_\-]+)$/, (matches) => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            let name = matches[1];

            Playlist.findOne({ name: name }, (err, playlist) => {
                if (err) {
                    this.logger.error(err);
                }

                if (!playlist) {
                    return this.reply("A playlist with that name doesn't exists.");
                }

                playlist.remove();
                this.reply(`The playlist **${name}** has been deleted.`);
            });
        });

        this.matches(/^remove ([\w\d_\-]+) (\d+)$/, (matches) => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            let name = matches[1],
                index = matches[2] - 1;

            Playlist.findOne({ name: name }, (err, playlist) => {
                if (err) {
                    this.logger.error(err);
                }

                if (!playlist) {
                    return this.reply("A playlist with that name doesn't exists.");
                }

                if (playlist.tracks[index] === undefined) {
                    return this.reply("No track with that index exists.")
                }

                let track = playlist.tracks[index];
                playlist.tracks.splice(index, 1);
                playlist.save();

                this.reply(`The song **${track.name}** has been deleted from **${playlist.name}**.`);
            });
        });
    }
}

module.exports = RemoveCommand;