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

                /*this.reply(
                    "Fetching information. If this is a playlist, it could take a bit.", (error, message) => {
                        this.fetchingMessage = message;
                    }
                );*/

                this.helper.fetchTrack(url).then(this.addTrack.bind(this, playlist));
                //this.helper.download(url, this.addSongs.bind(this, playlist));
            });
        });
    }

    addTrack(playlist, info) {
        if (playlist.tracks.find(track => track.link === info.link)) {
            this.reply(`The track **${info.title}** was already added to **${playlist.name}**`);
        }

        playlist.tracks.push({
            name: info.title,
            thumbnail: info.thumbnail_url,
            link: info.link,
            duration: info.length_seconds,
            user: this.author.id
        });

        playlist.save(error => {
            if (error) {
                this.reply('There was an issue adding your track.');
                this.logger.error(error);
                return false;
            }

            this.reply(`You have added **${info.title}** to the playlist **${playlist.name}**.`);
        })
    }
}

module.exports = AddTrackCommand;