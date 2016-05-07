'use strict';

const AbstractCommand = require('../AbstractCommand');

class StopCommand extends AbstractCommand {
    static get name() {
        return 'stop';
    }

    static get description() {
        return 'Stops the current queue.';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^stop$/, () => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            if (!this.helper.isPlaying()) {
                return this.reply("I am not playing any music stupid fuck!", true);
            }

            this.helper.stop();
            this.reply("Stopped playing the current queue.");
        });
    }
}

module.exports = StopCommand;