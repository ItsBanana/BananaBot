'use strict';

const AbstractCommand = require('../AbstractCommand');

class PauseCommand extends AbstractCommand {
    static get name() {
        return 'pause';
    }

    static get description() {
        return 'Pauses the currently playing track. (WIP!)';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^pause$/, () => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            if (!this.helper.isPlaying()) {
                return this.reply("I am not playing music!");
            }

            this.helper.pause();
            this.reply("[DEBUG] Paused the current track...");
        });
    }
}

module.exports = PauseCommand;