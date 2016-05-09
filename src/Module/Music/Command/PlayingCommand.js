'use strict';

const AbstractCommand = require('../AbstractCommand'),
      Parser = require('../Parser');

class PlayingCommand extends AbstractCommand {
    static get name() {
        return 'playing';
    }

    static get description() {
        return 'Shows the current playing track.';
    }

    handle() {
        this.matches(/^playing$/, () => {
            if (!this.helper.isPlaying()) {
                return this.reply("No tracks playing right now.");
            }

            let time = Parser.parseMilliseconds(this.helper.getCurrentTime(true)),
                track = this.helper.currentTrack;

            this.reply(`Now Playing:
**${track.name}** - \`[${time} / ${Parser.parseSeconds(track.duration)}]\``);
        });
    }
}

module.exports = PlayingCommand;