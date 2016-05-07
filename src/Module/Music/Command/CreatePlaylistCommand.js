'use strict';

const AbstractCommand = require('../AbstractCommand'),
    Playlist = require('../Model/Playlist'),
    Promise = require('bluebird');

class CreatePlaylistCommand extends AbstractCommand {
    static get name() {
        return 'create';
    }

    static get description() {
        return 'Creates/Imports a playlist with the given name.';
    }

    static get help() {
        return '<name> [youtube playlist url]- The name you want to give the playlist.';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^create$/, () => {
            this.reply(CreatePlaylistCommand.help);
        });

        this.matches(/^create ([\w\d_\-\s]+)$/, (matches) => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

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

        this.matches(/^create ([\w\d_\-\s]+) ((?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*))?$/, (matches) => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            let name = matches[1],
                link = matches[2];

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

                this.reply(`Fetching playlist, this might take some time.`);

                let playlistHelper = this.container.get('helper.playlist');
                playlistHelper.getYoutubePlaylistVideos(link).then(videoUrls => {
                    let tracks = videoUrls.map(videoUrl => {
                        return this.helper.fetchTrack(videoUrl);
                    });

                    Promise.all(tracks).then(tracks => {
                        tracks = tracks.map(track => {
                            return {
                                name: track.title,
                                thumbnail: track.thumbnail_url,
                                link: track.link,
                                duration: track.length_seconds,
                                user: this.author.id
                            }
                        });

                        new Playlist({ name: name, user: this.author.id, tracks: tracks }).save(error => {
                            if (error) {
                                this.reply("There was an error saving this playlist. Check the console.");
                                return this.logger.error(error);
                            }
                            this.reply(`Successfully fetched the playlist with ${tracks.length} tracks and saved it with the name **${name}**.`);
                        });
                    });
                }).catch(err => {
                    if (!err instanceof Error) {
                        this.reply(err);
                    } else {
                        this.logger.error(err);
                    }
                });
            });
        });
    }
}

module.exports = CreatePlaylistCommand;