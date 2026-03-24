export default async function serverManagement() {
  globalThis.handling_commands_actions["manage_servers"] =
    handleServerManagement;
  globalThis.handling_commands.push({
    label: "Manage Servers",
    value: "manage_servers",
    role_req: "admin_role_id",
  });

  async function handleServerManagement(interaction, guild, bypass) {
    let options = [];
    for (const server_name in globalThis.servers_link) {
      if (!bypass) {
        if (!guild) continue;
        if (globalThis.servers_link[server_name].data.guild != guild.id)
          continue;
        if (
          globalThis.servers_link[server_name].settings_data.access_role_id &&
          !interaction.member.roles.cache.has(
            globalThis.servers_link[server_name].settings_data.access_role_id
              .data.setting,
          )
        )
          continue;
      }
      options.push({ label: server_name, value: server_name });
    }
    const selected_server =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Game Server",
        options,
        "Please select a server:",
      );
    if (selected_server) {
      const game_server = globalThis.servers_link[selected_server];
      if (!game_server.handling_commands.length) {
        await globalThis.discord_client.ephemeralEmbedEdit(
          {
            title: "Request",
            desc: "No commands found for this server.",
            color: "#c70058",
          },
          interaction,
        );
        return;
      }
      const collected =
        await globalThis.discord_client.sendInteractionSelectMenu(
          interaction,
          "Select Action",
          game_server.handling_commands,
          "Please select action to perform:",
        );
      if (collected) {
        await game_server.handling_actions[collected](interaction, game_server);
      }
    }
  }
}
