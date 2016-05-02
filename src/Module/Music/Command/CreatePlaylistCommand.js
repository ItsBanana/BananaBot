'use strict';

const AbstractCommand = require('bananabot-base').AbstractCommand,
      Playlist = require('../Model/Playlist');

class CreatePlaylistCommand extends AbstractCommand {
    static get name() {
        return 'create';
    }

    static get description() {
        return 'Creates a playlist with the given name.';
    }

    static get help() {
        return '<name> - The name you want to give the playlist.';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^create$/, () => {
            this.reply(CreatePlaylistCommand.help);
        });

        this.matches(/^create ([\w\d_\-\s]+)$/, (matches) => {
            let name = matches[1];

            if (name.indexOf(' ') >= 0 || name.indexOf("\t") >= 0) {
                return this.reply("Playlist names cannot have a whitespace in them.");
            }

            Playlist.find({ name: name }, (err, playlists) => {
                if (err) {
                    this.logger.error(err);
                }

                if (playlists.length > 0) {
                    return this.reply("A playlist with that name already exists.");
                }

                new Playlist({ name: name, user: this.author.id }).save(error => {
                    if (error) {
                        this.reply("There was an error saving this playlist. Check the console.");
                        return this.logger.error(error);
                    }

                    this.reply(`The playlist **${name}** has been created.`);
                });
            });
        });
    }
}

module.exports = CreatePlaylistCommand;