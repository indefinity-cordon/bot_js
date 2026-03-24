import { PermissionsBitField } from "discord.js";

export default async function extendDiscordWHO(guild) {
  guild.extended_whomeme_listener = {
    function: null,
    params: [guild],
  };
  globalThis.events_listeners_links["messageCreate"].push(
    guild.extended_whomeme_listener,
  );
  initialize(guild);
  guild.modules["WhoMeme"] = initialize;
}

async function initialize(guild) {
  if (!guild.settings_data.whomeme?.data.setting) return;
  guild.extended_whomeme_listener["function"] = async (message, guild) => {
    if (message.channel.guild.id != guild.data.guild_id) return;

    const match = message.content.match(/^!кто\s+(.+)$/i);
    if (!match) return;

    const discord_guild = globalThis.discord_client.guilds.cache.get(
      guild.data.guild_id,
    );

    const members = discord_guild.members.cache.filter(
      (member) =>
        !member.user.bot &&
        message.channel
          .permissionsFor(member)
          .has(PermissionsBitField.Flags.ViewChannel),
    );

    const member = members.random();

    globalThis.discord_client.sendEmbed(
      {
        content: member ? `<@${member.id}> ${match[1]}` : "Никто",
        type: "reply",
      },
      message,
    );
  };
}
