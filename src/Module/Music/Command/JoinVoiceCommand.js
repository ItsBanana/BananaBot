'use strict';

const AbstractCommand = require('../AbstractCommand'),
    Discord = require('discord.js');

class JoinVoiceCommand extends AbstractCommand {
    static get name() {
        return "joinvoice"
    }

    static get description() {
        return "Joins the given voice channel.";
    }

    static get help() {
        return "[name] - The name of the voice channel, leave black to let it join your voice channel."
    }

    static get adminCommand() {
        return true;
    }

    handle() {
        this.matches(/^joinvoice$/, () => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            if (this.author.voiceChannel) {
                this.client.joinVoiceChannel(this.author.voiceChannel).then(() => {
                    this.reply('Hi I joined your voice channel.', true);
                });
            } else {
                this.reply(JoinVoiceCommand.help);
            }
        });

        this.matches(/^joinvoice ([\w\d_\-]+)$/, (matches) => {
            if (!this.isDJ()) {
                return this.reply("I believe you are not the DJ here!", true);
            }

            let name = matches[1];

            let channel = this.server.channels.find(
                channel => channel instanceof Discord.VoiceChannel && channel.name === name);

            if (channel) {
                this.client.joinVoiceChannel(channel).then(() => {
                    this.reply(`Hello everyone in **${channel.name}**, ready to hear some music?`);
                });
            } else {
                this.reply(`Sorry, but it looks like there is no voice channel with that name.`, true);
            }
        });
    }
}

module.exports = JoinVoiceCommand;