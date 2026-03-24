export default async function extendDiscordDA(guild) {
  guild.extended_da_listener = {
    function: null,
    params: [guild],
  };
  globalThis.events_listeners_links["messageCreate"].push(
    guild.extended_da_listener,
  );
  initialize(guild);
  guild.modules["Pizda"] = initialize;
}

async function initialize(guild) {
  if (!guild.settings_data.pizda?.data.setting) return;
  guild.extended_da_listener["function"] = async (message, guild) => {
    if (message.channel.guild.id != guild.data.guild_id) return;

    const funny_regex =
      /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.:;<=>?@\]^_`{|}~]/g;
    const not_funny_regex = /(^|\s)(да+)(,?)(\s|$)/gi;

    const filtered_message = message.content
      .replaceAll(funny_regex, "")
      .toLowerCase();
    if (!not_funny_regex.test(filtered_message) || Math.random() > 0.01) return;

    globalThis.discord_client.sendEmbed(
      { content: "Пизда!", type: "reply" },
      message,
    );
  };
}
