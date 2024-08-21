const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = async () => {
    global.LogsHandler = new class LogsHandlerclass {
        /**
         * @type {object}
         */
        botLogs;

        /**
         * @type {Function}
         */
        handle_message;

        /**
         * @type {Function}
         */
        build_error_embed;

        /**
         * @type {Function}
         */
        critical_error;
    
        /**
         * @type {Function}
         */
        error;
    
        /**
         * @type {Function}
         */
        warning;
    
        /**
         * @type {Function}
         */
        minor_error;
    
        /**
         * @type {Function}
         */
        send_log;
    
        constructor() {
            this.botLogs = null;
            this.handle_message = async function (error) {
                if (error) {
                    if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
                    if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
                }
            };
            this.build_error_embed = async function (error, title, name) {
                const embed = new Discord.EmbedBuilder()
                .setTitle(title)
                .addFields([
                    {
                        name: name,
                        value: error ? Discord.codeBlock(error) : `No ${name}`,
                    },
                    {
                        name: `Stack ${name}`,
                        value: error.stack ? Discord.codeBlock(error.stack) : `No stack ${name}`,
                    },
                ])
            };
            this.error = async function (error, title, name) {
                this.handle_message(error)
                this.send_log(this.build_error_embed(error, title, name))
            };
            this.send_log = async function (embed) {
                this.botLogs.send({
                    username: 'Bot Logs',
                    embeds: [embed],
                }).catch(() => {
                    console.log('Error sending to webhook')
                    console.log(error)
                })
            };
        }
    }
}