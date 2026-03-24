export default async function declareBasicServer(game_server) {
  game_server.serverCustomOperators = async function () {
    await updateServerCustomOperators();
    game_server.update_custom_operatos_interval = setInterval(
      updateServerCustomOperators,
      30 * 60000,
    );
  };

  //Обновляем этот калл, я люблю кушать калл
  async function updateServerCustomOperators() {
    if (
      !game_server.modules["Messages"] &&
      game_server.settings_data.funny_messages_function
    )
      (await import(`./../expanders/messages.js`)).default(game_server);
    if (
      !game_server.modules["Chats"] &&
      game_server.settings_data.info_exchange
    )
      (await import(`./../expanders/chats.js`)).default(game_server);
    if (
      !game_server.modules["Status"] &&
      game_server.settings_data.server_status
    )
      (await import(`./../expanders/status.js`)).default(game_server);
    if (!game_server.modules["TGS"] && game_server.data.tgs_address) {
      (await import(`./../expanders/tgs.js`)).default(game_server);
      if (
        !game_server.modules["Schedule"] &&
        game_server.settings_data.auto_start_config
      )
        (await import(`./../expanders/schedule.js`)).default(game_server);
    }
    for (const custom_function of game_server.updaters_poll)
      custom_function(game_server);
  }
}
