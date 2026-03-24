import { SlashCommandBuilder, InteractionType, MessageFlags } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify your discord account")
    .addStringOption((option) =>
      option
        .setName("identifier")
        .setDescription("Your byond account identifier")
        .setRequired(true),
    ),
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
    const identifier = await interaction.options.getString("identifier");
    if (!identifier)
      return globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Verification", desc: "Wrong identifier", color: "#c70058" },
        interaction,
      );

    for (const server_name in globalThis.servers_link) {
      if (globalThis.servers_link[server_name].data.guild != guild.id) continue;

      if (globalThis.servers_link[server_name]["do_verification"])
        return await globalThis.servers_link[server_name].do_verification(
          interaction,
          identifier,
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
