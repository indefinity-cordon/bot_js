import { EmbedBuilder } from "discord.js";

export default async function extendChats(game_server) {
  initialize(game_server);
  game_server.modules["Chats"] = initialize;
}

async function initialize(game_server) {
  if (Number.parseInt(game_server.settings_data.info_exchange.data.setting))
    game_server.SendByondMessages = SendByondMessages;
  game_server.updaters_poll.push(update);
}

async function update(game_server) {
  if (!Number.parseInt(game_server.settings_data.info_exchange.data.setting))
    return;

  if (game_server.update_custom_operators_data["intervals"]["events_messages"])
    clearInterval(
      game_server.update_custom_operators_data["intervals"]["events_messages"],
    );

  game_server.update_custom_operators_data["intervals"]["events_messages"] =
    setInterval(receiveByondMessages, 6 * 1000, game_server);
}

async function SendByondMessages(data, game_server) {
  const server_response = await game_server.byond_channel.request(
    {
      query: "send_info",
      auth: game_server.settings_data.topic_token.data.setting,
      data: data,
    },
    { retries: 1, timeout: 5 * 1000 },
  );
  return server_response?.statuscode == 200;
}

async function receiveByondMessages(game_server) {
  const server_response = await game_server.byond_channel.request(
    {
      query: "receive_info",
      auth: game_server.settings_data.topic_token.data.setting,
    },
    { retries: 1, timeout: 5 * 1000 },
  );
  if (server_response?.statuscode != 200) return;

  for (const type in server_response.data) {
    const channel_id = await globalThis.mysqlRequest(
      globalThis.database,
      "SELECT channel_id FROM server_channels WHERE server = ? AND type = ?",
      [game_server.id, type],
    );
    if (!channel_id.length) continue;

    for (const object of server_response.data[type]) {
      // Мне похуй, это петпроект, евал я ебал
      const evaluated_function = eval(
        game_server.settings_data.info_exchange_functions.param[type],
      );
      globalThis.addMessageToQueue(
        evaluated_function(
          object,
          globalThis.ByondEpochTimeOffset,
          globalThis.stripDiscordFun,
          EmbedBuilder,
        ),
        channel_id[0].channel_id,
      );
    }
  }
}
//Экземпл говнокода, молимся что он таким и будет...
/*
{
	"events": "(object, ByondEpochTimeOffset, stripDiscordFun) => new EmbedBuilder().setTitle(object.title).setDescription(`**Сикей:** ${object.player_ckey}\\n**Админ:** ${object.admin_ckey}\\n**Время:** <t:${Math.floor(ByondEpochTimeOffset + object.timestamp / 10)}:f>${object.duration ? `\\n**Истечет:** <t:${Math.floor(ByondEpochTimeOffset + object.duration / 10)}:f>` : ''}${object.reason ? `\\n**Причина:** ${stripDiscordFun(object.reason)}` : ''}\\n**Раунд:** ${object.round}${object.additional_info ? `\\n${object.additional_info}` : ''}`).setColor(object.color)",
	"ooc": "(object, ByondEpochTimeOffset, stripDiscordFun) => new EmbedBuilder().setTitle(' ').setDescription(`OOC: ${object.author}: ${stripDiscordFun(object.message)}`).setColor('#7289da')",
	"admin": "(object, ByondEpochTimeOffset, stripDiscordFun) => new EmbedBuilder().setTitle(' ').setDescription(`Asay: (${object.rank}) ${object.author}: ${stripDiscordFun(object.message)}`).setColor('#7289da')"
}
*/
