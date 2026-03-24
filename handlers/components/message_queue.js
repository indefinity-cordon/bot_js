const backloop_collectors = [];
export default function declareMessageQueue() {
  globalThis.message_queue = {};
  globalThis.backloop_message_queue = {};

  globalThis.events_listeners_links["clientReady"].push({
    function: async () => {
      startProcessing();
      setInterval(startProcessing, 20 * 60000);
      // каждые 2 секунды (рейтлимит дискорда на 5 сообщения в 5 секунд на 1 канал, 1.5 оставляет нам место для 1-2 двух сообщений без потери)
      setInterval(processMessageList, 2 * 1000);
      setInterval(processMessageBackloopList, 5.5 * 1000);
    },
    params: [],
  });

  globalThis.addMessageToQueue = function (embed, channel_id) {
    if (!globalThis.message_queue[channel_id]) {
      globalThis.message_queue[channel_id] = [];
    }
    globalThis.message_queue[channel_id].push(embed);
  };

  globalThis.stripDiscordFun = function (message) {
    return message
      .replaceAll(/<@&(\d+)>/g, " ")
      .replaceAll(/<@!?(\d+)>/g, " ")
      .replaceAll(/https?:\/\/\S+/g, " ")
      .replaceAll("@everyone", " ")
      .replaceAll("@here", " ");
  };
}

async function startProcessing() {
  for (const old_collector of backloop_collectors) {
    old_collector.stop();
  }
  for (const server_name in globalThis.servers_link) {
    if (globalThis.servers_link[server_name].SendByondMessages) {
      const db_request = await globalThis.mysqlRequest(
        globalThis.database,
        "SELECT type, channel_id, message_id FROM server_channels WHERE server = ? AND message_id = '-3'",
        [globalThis.servers_link[server_name].id],
      );
      for (const message_collector of db_request) {
        const channel = await globalThis.discord_client.channels.fetch(
          message_collector.channel_id,
        );
        if (!channel) continue;

        const collector = channel.createMessageCollector();
        collector.on("collect", (message) => {
          if (!message.author.bot) {
            if (!globalThis.backloop_message_queue[server_name]) {
              globalThis.backloop_message_queue[server_name] = {};
            }
            if (
              !globalThis.backloop_message_queue[server_name][
                message_collector.type
              ]
            ) {
              globalThis.backloop_message_queue[server_name][
                message_collector.type
              ] = [];
            }
            globalThis.backloop_message_queue[server_name][
              message_collector.type
            ].push({
              author: message.member.displayName,
              message: message.content,
            });
          }
        });
        backloop_collectors.push(collector);
      }
    }
  }
}

async function processMessageList() {
  for (const channel_id in globalThis.message_queue) {
    if (!globalThis.message_queue[channel_id].length) continue;

    const messages = globalThis.message_queue[channel_id];
    const selected = messages.splice(0, Math.min(9, messages.length));
    if (
      !(await globalThis.discord_client.sendEmbed(
        { embeds: selected },
        await globalThis.discord_client.channels.fetch(channel_id),
      ))
    )
      messages.unshift(selected);
  }
}

async function processMessageBackloopList() {
  for (const server_name in globalThis.backloop_message_queue) {
    const messages = globalThis.backloop_message_queue[server_name];
    if (!messages) continue;

    if (
      await globalThis.servers_link[server_name].SendByondMessages(
        messages,
        globalThis.servers_link[server_name],
      )
    )
      delete globalThis.backloop_message_queue[server_name];
  }
}
