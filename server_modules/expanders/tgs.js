export default async function extendTGS(game_server) {
  initialize(game_server);
  game_server.modules["TGS"] = initialize;
}

async function initialize(game_server) {
  game_server.handling_actions["manage_tgs"] = tgsActions;
  game_server.handling_commands.push({
    label: "Manage TGS",
    value: "manage_tgs",
  });
  game_server.updateTgs = true;
}

async function tgsActions(interaction, game_server) {
  const collected = await globalThis.discord_client.sendInteractionSelectMenu(
    interaction,
    "Select Action",
    globalThis.discord_client.handling_tgs,
    "Please select action to perform:",
  );
  if (collected) {
    globalThis.createLog(
      `${interaction.user.id} command: [${collected}]`,
      game_server,
    );
    const response_data = await globalThis.discord_client.handling_tgs_actions[
      collected
    ](
      game_server.data.tgs_address,
      game_server.data.tgs_login,
      game_server.data.tgs_pass,
      game_server.data.tgs_id,
      interaction,
    );
    await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Action",
        desc: `${response_data.status}: ${response_data.statusText}`,
        color: "#c70058",
      },
      interaction,
    );
  }
}
