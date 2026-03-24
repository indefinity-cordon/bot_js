export default async function redisComponent() {
  globalThis.discord_client.redisCallBack = async function (data) {
    if (!data)
      return console.log(
        "Database >> Redis >> [WARNING] Malformed Redis message, without data",
      );

    if (data.source == "DISCORD") return;
    let responded_game_server;
    for (const server_name in globalThis.servers_link) {
      if (globalThis.servers_link[server_name].instance_name !== data.source)
        continue;
      responded_game_server = globalThis.servers_link[server_name];
      break;
    }
    if (!responded_game_server)
      return console.log(
        `Database >> Redis >> [WARNING] Failed to find server object. Aborting. data: ${data.source}`,
      );

    let channel;
    if (data.type) {
      const status = await globalThis.mysqlRequest(
        globalThis.database,
        "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = ?",
        [responded_game_server.id, data.type],
      );
      if (!status.length)
        return console.log(
          `Database >> MySQL >> Failed to find server related feed channels. Aborting. server: ${responded_game_server.data.server_name}, channel: ${data.type}`,
        );

      channel = await globalThis.discord_client.channels.fetch(
        status[0].channel_id,
      );
      if (!channel)
        return console.log(
          `Database >> Redis >> [WARNING] Failed to find server related feed channels. Aborting. data: ${JSON.stringify(data)}`,
        );
    }

    if (responded_game_server.handledStatuses[data.state])
      await responded_game_server.handledStatuses[data.state](data, channel);
    else
      console.log(
        `Database >> Redis >> [WARNING] Unknown state received: ${data.state}`,
      );
  };

  globalThis.discord_client.redisLogCallback = async function (data) {
    //TODO: make in future something with it
    return data;
  };
}
