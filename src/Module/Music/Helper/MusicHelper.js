'use strict';

const ytdl = require('ytdl-core'),
      Parser = require('../Parser');

class MusicHelper {
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

    constructor(container, dispatcher, client, logger, brain, volume, removeAfterSkips) {
        this.container = container;
        this.dispatcher = dispatcher;
        this.client = client;
        this.logger = logger;
        this.brain = brain;
        this.current = -1;
        this.volume = volume / 100;
        this.removeAfterSkips = removeAfterSkips;

        this.stream = null;
        this.queueMessages = [];


        //To fix stuff, always bind this to the following functions
        this.skip = this.skip.bind(this);
        this.nextInQueue = this.nextInQueue.bind(this);
        this.updateQueueChannel = this.updateQueueChannel.bind(this);

        this.dispatcher.on('play', this.updateQueueChannel);
    }

    updateQueueChannel() {
        if (this.queueMessages.length > 0) {
            for (let queueMessage of this.queueMessages) {
                if (queueMessage.channel.id === this.channel.id) {
                    this.client.deleteMessage(queueMessage);
                }
            }
            this.queueMessages = [];
        }

        this.client.sendMessage(this.channel, this.getQueueText()).then(message => {
            this.queueMessages.push(message);
        }).catch(this.logger.error);
    }

    setVolume(volume) {
        /*if (!this.isPlaying()) {
            throw new Error("Not playing a track.");
        }*/ // Might have to fix this.

        volume = volume / 100;

        if (volume > 1) {
            volume = 1;
        }
        if (volume < 0) {
            volume = 0;
        }

        this.volume = volume;
        this.client.voiceConnection.setVolume(volume);
    }

    getVolume() {
        /*if (!this.isPlaying()) {
            throw new Error("Not playing a track.");
        }*/ // Might have to fix this.

        return this.client.voiceConnection.getVolume() * 100;
    }

    isPlaying() {
        return this.playing !== false;
    }

    buildQueue(playlist) {
        if (this.isPlaying()) {
            this.stop();
        }
        this.playlist = playlist;

        // Check if we still had a queue(WIP)
        this.brain.get(`queue.${playlist.name}`, (error, results) => {
            if (error) {
                this.reply("There was an error building the queue.");

                return this.logger.error(error);
            }

            this.queue = results || playlist.tracks;
            this.nextInQueue();
        });
    }

    getQueueText() {
        let time = Parser.parseMilliseconds(this.getCurrentTime(true)),
            message = `Now Playing:
**${this.playing.name}** - \`[${time} / ${Parser.parseSeconds(this.playing.duration)}]\`

`;

        let len = this.queue.length < 15 ? this.queue.length : 15 + this.current;

        if (len > this.current + 1) {
            message += `Next in the queue:\n`;
            for (let i = this.current + 1; i < len; i++) {
                message += `\`${i + 1}.\` **${this.queue[i].name}**\n`;
            }

            if (len < this.queue.length - 1) {
                message += `\nAnd *${this.queue.length - len}* more tracks.`;
            }
        } else {
            message += `No other tracks left.`;
        }

        return message;
    }

    nextInQueue() {
        if (this.isPlaying()) {
            try {
                this.memory.del(`skip.${this.helper.playlist.name}`);
            } catch (e) {
                this.logger.error(e);
            }
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

        this.play(this.getCurrentTrack());
    }

    getCurrentTrack() {
        return this.queue[this.current];
    }

    fetchTrack(link) {
        return new Promise((resolve, reject) => {
            let regexHelper = this.container.get('helper.regex');
            //this.logger.debug(link);
            // Check if the link is an youtube link.
            regexHelper.getMatches(link, /(?:https ?:\/\/)?(?:youtu\.be\/|(?:www\.)?youtube\.com\/watch(?:\.php)?\?.*v=)([a-zA-Z0-9\-_]+)/g, matches => {
                if (matches) {
                    ytdl.getInfo(matches[0], (err, info) => {
                        this.logger.debug(`Fetched shit for the video: ${link}`);
                        if (err) reject(err);
                        else {
                            info.link = link;
                            resolve(info);
                        }
                    });
                } else {
                    reject();
                }
            });
        });
    }

    skip(callback) {
        if (callback !== undefined) {
            callback(this.playing);
        }
        this.stopPlaying(this.nextInQueue);
    }

    play(track, seek) {
        this.stream = ytdl(track.link, {
            filter: format => format.container === 'mp4',
            quality: 'lowest'
        });

        this.stream.on('error', this.logger.error);

        seek = seek || 0;
        this.client.voiceConnection.playRawStream(this.stream, { volume: this.volume, seek: seek }).then(stream => {
            this.seekVal = seek > 0 ? seek : false;

            this.client.setStatus('online', track.name);

            this.playing = track;
            this.currentPlayingStream = stream;

            this.dispatcher.emit('play', track);

            stream.on('end', this.nextInQueue);
            stream.on('error', this.logger.error);
        }).catch(this.logger.error);
    }

    getCurrentTime(inMs) {
        inMs = inMs || false;
        let time = parseInt(this.client.voiceConnection.streamTime / 1000);

        if (this.seekVal !== false) {
            time += parseInt(this.seekVal);
        }

        return time * (inMs ? 1000 : 1);
    }

    seek(seconds) {
        if (this.isPlaying()) {
            this.stopPlaying();
        }

        let track = this.queue[this.current];

        this.play(track, seconds);
    }

    pause() {
        this.lastPlaytime = this.getCurrentTime();
        this.stopPlaying();
    }

    resume() {
        this.seek(this.lastPlaytime);
    }

    stop() {
        if (!this.isPlaying()) {
            throw new Error("Not playing a track.");
        }

        this.queue = undefined;
        this.current = -1;
        this.stopPlaying();
    }

    stopPlaying(callback) {
        this.playing = false;
        this.currentPlayingStream.removeListener('end', this.nextInQueue);
        this.client.setStatus('online', null);
        if (this.client.voiceConnection !== null) {
            this.client.voiceConnection.stopPlaying();
        }

        if (callback !== undefined) {
            callback();
        }
    }
}

module.exports = MusicHelper;