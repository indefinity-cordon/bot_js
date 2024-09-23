const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = class LogsHandlerclass {
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
    error;

    /**
     * @type {Function}
     */
    send_log;

    /**
     * @type {boolean}
     */
    notified;

    constructor() {
        this.botLogs = null;
        this.notified = false;
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
            ]);
            return embed;
        };
        this.error = async function (error, title, name) {
            this.handle_message(error);
            const embed = await this.build_error_embed(error, title, name);
            this.send_log(embed);
        };
        this.send_log = async function (embed) {
            if (!this.botLogs) {
                if (!this.notified) {
                    console.log(chalk.blue(chalk.bold(`Webhook`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`no webhook`));
                    this.notified = true;
                }
                return;
            }
            await this.botLogs.send({
                username: 'Bot Logs',
                embeds: [embed],
            }).catch((error) => {
                console.log(chalk.blue(chalk.bold(`Webhook`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(error));
            });
        };
    }
}