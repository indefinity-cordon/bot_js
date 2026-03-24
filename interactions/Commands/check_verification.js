import { SlashCommandBuilder, InteractionType, MessageFlags } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("check-verify")
    .setDescription("Check verification of your discord account"),
  run: async (interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let guild;
    if (interaction.guildId)
      guild = globalThis.guilds_link[`${interaction.guildId}`];
    if (!guild)
      return globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: "No verification for this server",
          color: "#c70058",
        },
        interaction,
      );

    await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Verification", desc: "In progress...", color: "#669917" },
      interaction,
    );
    for (const server_name in globalThis.servers_link) {
      if (globalThis.servers_link[server_name].data.guild != guild.id) continue;

      if (globalThis.servers_link[server_name]["check_verification"])
        return await globalThis.servers_link[server_name].check_verification(
          interaction,
        );

      break;
    }
    await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Verification",
        desc: "System not implemented",
        color: "#c70058",
      },
      interaction,
    );
  },
};
