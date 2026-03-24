import { EmbedBuilder, codeBlock, WebhookClient } from "discord.js";

//Базовый логгинг ошибок, фэйлсейф что бы не ебать мозги людям что не смогли заполнить нормально дб по каждому их мисклику что они описывают мне в лс, пусть сами разбираются
export default class LogsHandlerclass {
  botLogs = null;
  notified = false;

  async setNewWebhook(id, token) {
    if (!id || !token) return;
    this.botLogs = new WebhookClient({
      id: id,
      token: token,
    });
  }

  async handle_message(error) {
    if (error) {
      if (error.length > 950)
        error = error.slice(0, 950) + "... view console for details";
      if (error.stack)
        if (error.stack.length > 950)
          error.stack =
            error.stack.slice(0, 950) + "... view console for details";
    }
  }
  async build_error_embed(error, title, footer, name) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setFooter({ text: footer })
      .addFields([
        {
          name: name,
          value: error ? codeBlock(error) : `No ${name}`,
        },
        {
          name: `Stack ${name}`,
          value: error?.stack ? codeBlock(error.stack) : `No stack ${name}`,
        },
      ]);
    return embed;
  }
  async error(error, title, footer, name) {
    this.handle_message(error);
    const embed = await this.build_error_embed(error, title, footer, name);
    this.sendLog(embed);
  }
  async sendLog(embed) {
    if (!this.botLogs) {
      if (!this.notified) {
        console.log("Webhook >> [ERROR] >> no webhook");
        this.notified = true;
      }
      return;
    }
    await this.botLogs
      .send({
        username: "Bot Logs",
        embeds: [embed],
      })
      .catch((error) => {
        console.log("Webhook >> [ERROR] >>", error);
      });
  }
  async sendSimplyLog(title, desc, footer, fields) {
    const embed = new EmbedBuilder();
    if (title) embed.setTitle(title);
    if (desc) embed.setDescription(desc);
    if (footer) embed.setFooter({ text: footer });
    if (fields) embed.addFields(fields);
    this.sendLog(embed);
  }
}
