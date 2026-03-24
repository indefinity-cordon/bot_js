import { SlashCommandBuilder, InteractionType, MessageFlags } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Use admin command"),
  run: async (interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let guild;
    if (interaction.guildId)
      guild = globalThis.guilds_link[`${interaction.guildId}`];
    const bypass = globalThis.bypass_ids.includes(interaction.user.id);
    if (!guild && !bypass) {
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Admin",
          desc: `No support for admin commands in ${interaction.member ? "this guild, try in another" : "DMs"}.`,
          color: "#c70058",
        },
        interaction,
      );
      return;
    }

    const available_commands = [];
    for (const command of globalThis.handling_commands) {
      if (command.role_req && !bypass) {
        if (!guild) continue;
        if (!guild.settings_data[command.role_req]) continue;
        if (
          !interaction.member.roles.cache.has(
            guild.settings_data[command.role_req].data.setting,
          )
        )
          continue;
      }
      available_commands.push(command);
    }
    if (!available_commands.length) {
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Admin",
          desc: "You don't have permission to use any admin commands.",
          color: "#c70058",
        },
        interaction,
      );
      return;
    }
    const collected = await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Command",
      available_commands,
      "Please select command:",
    );
    if (collected) {
      await globalThis.handling_commands_actions[collected](
        interaction,
        guild,
        bypass,
      );
    }
  },
};
