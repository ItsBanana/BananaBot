'use strict';

const AbstractCommand = require('../AbstractCommand');

class PlayCommand extends AbstractCommand {
    static get name() {
        return 'play';
    }

    static get description() {
        return 'Plays the given playlist.';
    }

    static get help() {
        return '<playlist> - The playlist you wanna play.';
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^play$/, () => {
            this.reply(PlayCommand.help);
        });
    }
}

module.exports = PlayCommand;