'use strict';

const AbstractCommand = require('../AbstractCommand'),
      Parser = require('../Parser');

class QueueCommand extends AbstractCommand {
    static get name() {
        return 'queue';
    }

    static get description() {
        return 'Shows the current queue.';
    }

    handle() {
        this.matches(/^queue$/, () => {
            if(!this.helper.isPlaying()) {
                return this.reply("No playlist is playing right now.");
            }

            this.reply(this.helper.getQueueText()).then(message => {
                this.helper.queueMessages.push(message);
            });
        });
    }
}

module.exports = QueueCommand;