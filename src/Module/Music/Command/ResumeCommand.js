'use strict';

const AbstractCommand = require('../AbstractCommand');

class ResumeCommand extends AbstractCommand {
    static get name() {
        return 'resume';
    }

    static get description() {
        return 'Resume the currently playing track. (WIP!)';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^resume$/, () => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            if (this.helper.isPlaying()) {
                return this.reply("I am already playing music!");
            }

            this.helper.resume();
            this.reply("[DEBUG] Resumed the current track...");
        });
    }
}

module.exports = ResumeCommand;