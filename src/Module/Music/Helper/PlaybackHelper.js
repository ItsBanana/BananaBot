'use strict';

const slug = require('slug');
const fs = require('fs');
const youtubedl = require('youtube-dl');
const _ = require('lodash');
const Playlist = require('../Model/Playlist');
const child = require('child_process');
const Parser = require('../Parser');

class PlaybackHelper {
    get playing() {
        return this._playing || false;
    }

    set playing(value) {
        this._playing = value;
    }

    get channel() {
        return this._channel;
    }

    set channel(value) {
        this._channel = value;
    }

    constructor(dispatcher, client, logger, brain, dir, volume, removeAfterSkips) {
        this.dispatcher = dispatcher;
        this.client = client;
        this.logger = logger;
        this.brain = brain;
        this.dir = dir;
        this.current = -1;
        this.volume = volume;
        this.removeAfterSkips = removeAfterSkips;

        this.stream = null;

        this.skip = this.skip.bind(this);
        this.nextInQueue = this.nextInQueue.bind(this);
        this.setQueueChannel = this.setQueueChannel.bind(this);
        this.updateQueueChannel = this.updateQueueChannel.bind(this);

        this.dispatcher.on('play', this.updateQueueChannel);
    }

    setQueueChannel(id) {
        this.dispatcher.removeListener('play', this.updateQueueChannel);
        this.dispatcher.on('play', this.updateQueueChannel);
        this.updateQueueChannel(id);
    }

    updateQueueChannel(id) {
        let channel = this.channel.server.channels.get('id', id);

        this.client.getChannelLogs(channel, 50, {}, (error, messages) => {
            if (messages.length > 1) {
                for (let i = 1; i < messages.length; i++) {
                    this.client.deleteMessage(messages[i]);
                }
            }

            if (messages.length > 0) {
                this.client.updateMessage(messages[0], this.getQueueText());
            } else {
                this.client.sendMessage(channel, this.getQueueText());
            }
            clearTimeout(this.queueTimeout);
            this.queueTimeout = setTimeout(this.updateQueueChannel, 5000);
        });
    }

    getQueueText() {
        let time = Parser.parseMilliseconds(this.getCurrentTime(true)),
            current = this.playing,
            message = `Playing the **${this.playlist.name}** playlist.\n\nNow Playing: **${current.name}**\n\`[${time} / ${Parser.parseSeconds(current.duration)}]\` - *${current.link}*\n\n`;

        let added = 0,
            index = this.current + 1;

        while (true) {
            if (message.length > 1800) {
                break;
            }

            if (index >= this.queue.length) {
                index = 0;
            }

            let track = this.queue[index],
                user = this.client.users.get('id', track.user);

            message += `\`${added + 1}.\` **${track.name}** added by **${user.username}**\n`;
            added++;
            index++;
        }

        if (added < this.queue.length - 1) {
            message += `\nAnd *${this.queue.length - added}* more tracks.`;
        }

        return message;
    }

    isPlaying() {
        return this.playing !== false;
    }

    buildQueue(playlist) {
        this.playlist = playlist;
        this.brain.get('queue.' + playlist.name, (error, results) => {
            if (error) {
                this.reply("There was an error building the queue.");

                return this.logger.error(error);
            }

            this.queue = results === null || results === undefined ? playlist.tracks : JSON.parse(results);

            this.nextInQueue();
        })
    }

    skip(track) {
        if (track === undefined) {
            track = true;
        }

        if (track) {
            Playlist.findOne({ name: this.playlist.name }, (err, playlist) => {
                let index = playlist.tracks.findIndex(song => song.name == this.queue[this.current].name);
                if (!playlist.tracks[index].skips) {
                    playlist.tracks[index].skips = 0;
                }

                playlist.tracks[index].skips++;

                if (playlist.tracks[index].skips > this.removeAfterSkips) {
                    playlist.tracks.splice(index, 1);
                    this.queue.splice(this.current, 1);

                    this.client.sendMessage(this.channel, 'This song has been removed after being skipped too many times.');
                }

                playlist.save();
            });
        }

        this.stopPlaying(this.nextInQueue);
    }

    nextInQueue() {
        if (this.isPlaying()) {
            this.stopPlaying();
        }

        this.current++;
        if (!this.running) {
            this.current = 0;
            return;
        }

        if (this.queue[this.current] === undefined) {
            this.current = 0;
        }

        let track = this.getCurrentSong(),
            name = slug(track.name.toLowerCase()),
            filename = this.dir + '/' + name + '.cache';


        fs.stat(filename, error => {
            if (error === null) {
                return this.play(song);
            }

            this.download(track.link, tracks => this.play(track));
        });
    }

    getCurrentTrack() {
        return this.queue[this.current];
    }

    getLinks(link, callback) {
        child.execFile(
            __dirname + '/../../../../node_modules/youtube-dl/bin/youtube-dl',
            ['--format=bestaudio', '-i', '-J', '--yes-playlist', link],
            { maxBuffer: 10000 * 1024 },
            (err, stdout, stderr) => {
                console.log(stdout);
                callback(JSON.parse(stdout));
            }
        );
    }

    download(link, callback) {
        this.logger.info("Fetching link info for " + link);
        this.getLinks(link, (json) => {
            let items = Array.isArray(json.entries) ? json.entries : [json];

            this.logger.info(`Downloading ${items.length} tracks`);
            let requests = items.map(track => {
                if (!track) {
                    return;
                }

                this.logger.info("Creating promise for " + track.title);

                return new Promise(resolve => {
                    let video = youtubedl(track.webpage_url, ['--format=bestaudio'], {
                        maxBuffer: 10000 * 1024,
                        cwd: this.dir
                    }),
                        filename = this.dir + '/' + slug(track.title.toLowerCase()) + '.cache';
                    video.pipe(fs.createWriteStream(filename));
                    this.logger.info("Track started downloading: " + filename);
                    this.client.setStatus('online', "Downloading: " + track.title);

                    video.on('error', error => {
                        this.client.sendMessage(
                            this.channel,
                            `There was an error downloading **${track.title}** from the link provided.`
                        );

                        this.logger.error(error);
                        resolve(null);
                    });

                    video.on('end', () => {
                        this.logger.info("Track finished downloading");
                        resolve(track);
                    });
                })
            });

            Promise.all(requests).then(tracks => {
                tracks = tracks.filter(track => track !== null);

                this.logger.log(`Downloaded ${tracks.length} tracks`);
                callback(tracks);
            }).catch(this.logger.error)
        });
    }

    play(track, seek, callback) {
        let name = slug(track.name.toLowerCase()),
            filename = this.dir + '/' + name + '.cache';

        seek = seek || 0;
        this.client.voiceConnection.playFile(filename, { volume: this.volume, seek: seek }, (error, stream) => {
            this.dispatcher.emit('play', song);

            this.seekVal = seek > 0 ? seek : false;

            let user = this.client.users.get('id', track.user);

            let playMessage;
            this.client.sendMessage(
                this.channel,
                `Now playing **${track.name}**. Requested by **${user.name}**`,
                (error, message) => {
                    playMessage = message;
                }
            );

            this.client.setStatus('online', track.name);
            this.logger.info("Playing " + track.name + ' - ' + filename);

            this.stream = stream;
            this.playing = track;

            if (error) {
                this.logger.error(error);

                return this.client.sendMessage(this.channel, "There was an issue playing the current song.");
            }

            this.stream.on('end', this.nextInQueue);
            this.stream.on('end', () => this.client.deleteMessage(playMessage));

            callback();
        });
    }

    setVolume(volume) {
        if (!this.isPlaying()) {
            throw new Error("Not playing a song.");
        }
        volume = volume / 100;

        if (volume > 1) {
            volume = 1;
        }
        if (volume < 0) {
            volume = 0;
        }

        this.client.voiceConnection.setVolume(volume);
    }

    getVolume() {
        if (!this.isPlaying()) {
            throw new Error("Not playing a song.");
        }

        return this.client.voiceConnection.getVolume() * 100;
    }

    getCurrentTime(inMs) {
        inMs = inMs === undefined ? false : inMs;
        let time = parseInt(this.client.voiceConnection.streamTime / 1000);

        if (this.seekVal !== false) {
            time += parseInt(this.seekVal);
        }

        return time * (inMs ? 1000 : 1);
    }

    seek(seconds, callback) {
        if (this.isPlaying()) {
            this.stopPlaying();
        }

        let track = this.queue[this.current];

        this.play(track, seconds, callback);
    }

    pause(callback) {
        this.lastPlaytime = this.getCurrentTime();
        this.stopPlaying(callback);
    }

    resume(callback) {
        this.seek(this.lastPlaytime, callback);
    }

    stopPlaying(callback) {
        this.playing = false;
        this.stream.removeListener('end', this.nextInQueue);
        this.client.setStatus('online', null);
        if (this.client.voiceConnection !== null) {
            this.client.voiceConnection.stopPlaying();
        }

        if (callback !== undefined) {
            callback();
        }
    }
}

module.exports = PlaybackHelper;