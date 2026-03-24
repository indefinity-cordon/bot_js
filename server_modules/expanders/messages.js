export default async function extendChats(game_server) {
  game_server.extended_chats_listener = {
    function: null,
    params: [game_server],
  };
  globalThis.events_listeners_links["messageCreate"].push(
    game_server.extended_chats_listener,
  );
  initialize(game_server);
  game_server.modules["Messages"] = initialize;
}

async function initialize(game_server) {
  if (!game_server.settings_data.funny_messages_function?.data.setting) return;
  //Я люблю евал (я его ебал)
  game_server.extended_chats_listener["function"] = eval(
    game_server.settings_data.funny_messages_function.data.setting,
  );
}
