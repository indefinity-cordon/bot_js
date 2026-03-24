export default async function messageUpdater() {
  globalThis.discord_client.serverMessageUpdator = async function (
    game_server,
  ) {
    setTimeout(updateUpdatersMessages, 10000, game_server);
    game_server.update_status_messages_interval = setInterval(
      updateUpdatersMessages,
      30 * 60000,
      game_server,
    );
  };
}

async function updateUpdatersMessages(game_server) {
  const db_request = await globalThis.mysqlRequest(
    globalThis.database,
    "SELECT type, channel_id, message_id FROM server_channels WHERE server = ? AND message_id NOT LIKE '-%'",
    [game_server.id],
  );
  if (!db_request.length) {
    console.log(
      `Failed to find server related feed channels. Aborting, for ${game_server.data.server_name}`,
    );
    return;
  }
  for (const type in game_server.updater_messages) {
    clearInterval(game_server.message_updater_intervals[type]);
    delete game_server.message_updater_intervals[type];
    delete game_server.updater_messages[type];
  }
  for (const updater of db_request) {
    const channel = await globalThis.discord_client.channels.fetch(
      updater.channel_id,
    );
    let found_message = null;
    if (updater.message_id) {
      if (await globalThis.discord_client.HasPermsWriteAccess(channel))
        continue;

      await channel.messages.fetch().then((messages) => {
        for (const message of messages) {
          if (message[1].id === updater.message_id) {
            found_message = message[1];
          }
        }
      });
    }
    if (found_message === null) {
      await globalThis.discord_client
        .embed(
          {
            content: `${game_server.data.server_name}`,
            desc: "preparing...",
          },
          channel,
        )
        .then((message) => {
          if (message) {
            found_message = message;
            globalThis.mysqlRequest(
              globalThis.database,
              "UPDATE server_channels SET message_id = ? WHERE server = ? AND type = ? AND channel_id = ?",
              [message.id, game_server.id, updater.type, updater.channel_id],
            );
          }
        });
    }
    if (!game_server.updater_messages[updater.type])
      game_server.updater_messages[updater.type] = [];
    game_server.updater_messages[updater.type].push(found_message);
  }
  for (const type in game_server.updater_messages) {
    game_server.handling_updaters[type](type, game_server);
    game_server.message_updater_intervals[type] = setInterval(
      game_server.handling_updaters[type],
      1 * 60000,
      type,
      game_server,
    );
  }
}
