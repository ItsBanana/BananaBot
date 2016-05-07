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

            this.memory.get(`skip.${this.helper.playlist.name}.${this.helper.playing.name}`, (err, skips) => {
                skips = skips || [];
                // The author voted already.
                if (skips.find(id => id === this.author.id)) {
                    return this.reply(`You already voted to skip the current track!`, true);
                }

                // The author didn't vote to skip yet...
                skips.push(this.author.id);

                // Update the skip memory
                this.memory.set(`skip.${this.helper.playlist.name}.${this.helper.playing.name}`, skips);

                let votes = skips.length,
                    currentUsers = this.client.voiceConnection.voiceChannel.members.length - 1,
                    requiredVotes = this.container.getParameter('skip_count') || currentUsers - 1, // Incase there are 5 users 4 votes are needed.
                    neededVotes = requiredVotes - votes;

                if (votes < requiredVotes) {
                    this.reply(`You voted to skip **${this.helper.playing.name}**.`);
                    setTimeout(() => {
                            this.reply(`Currently \`${votes}/${requiredVotes}\` users voted to skip **(${this.helper.playing.name}**, need \`${neededVotes}\` more ${neededVotes == 1 ? 'vote': 'votes'}.`);
                    }, 500);
                } else {
                    this.helper.skip(oldTrack => {
                        this.reply(`Votes passed, skipping **${oldTrack.name}**.`);
                    });
                }
            });
        });
    }
}

module.exports = SkipCommand;