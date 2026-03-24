import { SlashCommandBuilder, InteractionType, MessageFlags } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Order information about yourself")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Select user to show info about")
        .setRequired(true),
    ),
  run: async (interaction) => {
    if (
      interaction.type !== InteractionType.ApplicationCommand ||
      !Object.entries(globalThis.servers_link).length
    )
      return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guildId)
      return globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "This application don't have access to critical information, please try again without globalThis command (you need invite bot to server)",
          color: "#c70058",
        },
        interaction,
      );

    const servers_options = Object.keys(globalThis.servers_link).map(
      (server) => ({
        label: server,
        value: server,
      }),
    );
    const collected = await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Game Server",
      servers_options,
      "Please select a game server:",
    );
    if (globalThis.servers_link[collected].infoRequest) {
      await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Request", desc: "Retrieving data...", color: "#c70058" },
        interaction,
      );
      await globalThis.servers_link[collected].infoRequest(interaction);
    } else {
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "No data for this server...",
          color: "#c70058",
        },
        interaction,
      );
    }
  },
};
