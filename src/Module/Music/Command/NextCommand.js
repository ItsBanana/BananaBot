'use strict';

const AbstractCommand = require('../AbstractCommand');

class NextCommand extends AbstractCommand {
    static get name() {
        return 'next';
    }

    static get description() {
        return 'Plays the next track in the queue.';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^next$/, () => {
            if (!this.helper.isPlaying()) {
                return this.reply("Not playing any queue right now.");
            }

            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            this.helper.skip();
        });
    }
}

module.exports = NextCommand;