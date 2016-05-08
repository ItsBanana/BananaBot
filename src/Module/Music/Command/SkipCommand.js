'use strict';

const AbstractCommand = require('../AbstractCommand');

class SkipCommand extends AbstractCommand {
    static get name() {
        return 'skip';
    }

    static get description() {
        return 'Votes to skip the current track.';
    }

    handle() {
        this.matches(/^skip$/, () => {
            if (!this.helper.isPlaying()) {
                return this.reply("Not playing any queue right now.");
            }

            if (!this.client.voiceConnection.voiceChannel.members.get('id', this.author.id)) {
                return this.reply("You are not listening to my music dip shit!", true);
            }

            this.memory.get(`skip.${this.helper.playlist.name}`, (err, skips) => {
                skips = skips || [];
                // The author voted already.
                if (skips.find(id => id === this.author.id)) {
                    return this.reply(`You already voted to skip the current track!`, true);
                }

                // The author didn't vote to skip yet...
                skips.push(this.author.id);

                // Update the skip memory
                this.memory.set(`skip.${this.helper.playlist.name}`, skips);

                let votes = skips.length,
                    currentUsers = this.client.voiceConnection.voiceChannel.members.length - 1,
                    votedUsersP = Math.floor(votes / currentUsers * 100),
                    neededUsersP = 50 - votedUsersP < 0 ? 0 : 50 - votedUsersP,
                    neededUsers = Math.round(currentUsers * (neededUsersP / 100));

                if (votedUsersP < 50) {
                    this.reply(`You voted to skip **${this.helper.playing.name}**.`);
                    setTimeout(() => {
                        this.reply(`Currently \`${votedUsersP}%\` of the users have voted to skip **(${this.helper.playing.name}**, need \`${neededUsers}\` more ${neededUsers == 1 ? 'user' : 'users'} to vote.`);
                    }, 500);
                } else {
                    // Temp fix...
                    try {
                        this.memory.del(`skip.${this.helper.playlist.name}`);
                    } catch (e) {
                        this.logger.error(e);
                    }
                    this.helper.skip(oldTrack => {
                        this.reply(`Votes passed, skipping **${oldTrack.name}**.`);
                    });
                }
            });
        });
    }
}

module.exports = SkipCommand;