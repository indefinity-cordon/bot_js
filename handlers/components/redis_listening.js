let subscriber;
let collectors = [];
export default async function redisListener() {
  globalThis.events_listeners_links["clientReady"].push({
    function: async () => {
      startListining();
      setInterval(startListining, 20 * 60000);
    },
    params: [],
  });
}

async function startListining() {
  if (!globalThis.redis_connection) return;

  if (subscriber) subscriber.disconnect();
  subscriber = globalThis.redis_connection.duplicate();
  await subscriber.connect();
  subscriber.pSubscribe("byond.*", async (data) => {
    if (isJsonString(data))
      globalThis.discord_client.redisCallBack(JSON.parse(data));
    else globalThis.discord_client.redisLogCallback(data);
  });

  for (const old_collector of collectors) {
    old_collector.stop();
  }
  for (const server_name in globalThis.servers_link) {
    const db_request = await globalThis.mysqlRequest(
      globalThis.database,
      "SELECT type, channel_id, message_id FROM server_channels WHERE server = ? AND message_id = '-2'",
      [globalThis.servers_link[server_name].id],
    );
    if (!db_request.length) continue;

    for (const message_collector of db_request) {
      const channel = await globalThis.discord_client.channels.fetch(
        message_collector.channel_id,
      );
      if (!channel) continue;

      const collector = channel.createMessageCollector();
      collector.on("collect", (message) => {
        if (!message.author.bot) {
          globalThis.redis_connection.publish(
            message_collector.type,
            JSON.stringify({
              color: "#22a88b",
              source: "DISCORD",
              author: message.member.displayName,
              message: message.content,
            }),
          );
        }
      });
      collectors.push(collector);
    }
  }
}

function isJsonString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
