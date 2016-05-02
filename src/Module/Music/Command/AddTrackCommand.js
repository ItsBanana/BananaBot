'use strict';

const AbstractCommand = require('../AbstractCommand'),
    Playlist = require('../Model/Playlist');

class AddTrackCommand extends AbstractCommand {
    static get name() {
        return 'add';
    }

    static get description() {
        return 'Adds the given track, to the given playlist.';
    }

    static get help() {
        return '<playlist> <url> - The playlist were u want to add the track plus the url of the track, can also be a youtube link.';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^add$/, () => {
            this.reply(AddTrackCommand.help);
        });

        this.matches(/^add ([\w\d_\-]+) ((?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*))?$/i, matches => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            let name = matches[1],
                url = matches[2];

            Playlist.findOne({ name: name }, (err, playlist) => {
                if (err) {
                    this.logger.error(err);
                }

                if (!playlist) {
                    return this.reply("Could not find playlist with that name.");
                }

                this.reply(
                    "Fetching information. If this is a playlist, it could take a bit.", (error, message) => {
                        this.fetchingMessage = message;
                    }
                );

                this.helper.download(url, this.addSongs.bind(this, playlist));
            });
        });
    }

    addSongs(playlist, tracks) {
        let requests = tracks.map(this.addSong.bind(this, playlist));
        Promise.all(requests).then((values) => {
            this.client.deleteMessage(this.fetchingMessage);

            let errors = values.filter(err => err !== undefined);
            if (errors) {
                this.reply(errors.join("\n"));

                if (errors.length === tracks.length) {
                    return;
                }
            }

            playlist.save(error => {
                if (error) {
                    this.reply('There was an issue adding your tracks.');
                    this.logger.error(error);

                    return false;
                }

                let added = tracks.length - errors.length;
                this.client.reply(`You have added **${added}** song${added == 1 ? 's' : ''} to **${playlist.name}**,`);
            })
        }).catch(this.logger.error);
    }


    addSong(playlist, info) {
        return new Promise(resolve => {
            if (!info) {
                resolve();
            }

            this.logger.debug(`Adding ${info.title} to ${playlist.name}`);

            if (playlist.tracks.find(song => song.link === info.webpage_url)) {
                this.logger.debug(`Song already added: **${info.title}**`);

                return resolve(`Song already added: **${info.title}**`);
            }

            playlist.tracks.push({
                name: info.title,
                thumbnail: info.thumbnail,
                link: info.webpage_url,
                duration: info.duration,
                user: this.author.id
            });

            resolve();
        });
    }
}

module.exports = AddTrackCommand;