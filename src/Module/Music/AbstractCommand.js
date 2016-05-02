'use strict'

const BaseAbstractCommand = require('bananabot-base').AbstractCommand;

class AbstractCommand extends BaseAbstractCommand {
    initialize() {
        super.initialize();

        this.helper = this.container.get('helper.playback');
        this.memory = this.container.get('brain.memory');
    }

    isDJ() {
        let roleHelper = this.container.get('helper.role');
        return roleHelper.hasUserRoleInServer(this.author, 'DJ', this.server);
    }
}

module.exports = AbstractCommand;