export default async function extendCustomShit(guild) {
  guild.extended_chats_listener = {
    function: null,
    params: [guild],
  };
  globalThis.events_listeners_links["messageCreate"].push(
    guild.extended_chats_listener,
  );
  initialize(guild);
  guild.modules["Messages"] = initialize;
}

async function initialize(guild) {
  if (!guild.settings_data.funny_messages_function?.data.setting) return;
  //Обычный евал по всем стандартам не безопасности
  guild.extended_chats_listener["function"] = eval(
    guild.settings_data.funny_messages_function.data.setting,
  );
}
