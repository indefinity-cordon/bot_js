import { ActivityType } from "discord.js";

export default async function clientReady() {
  console.log("\u001b[0m");
  if (!process.TEST_RUN)
    console.log(
      `System >> Shard #${globalThis.discord_client.shard.ids[0] + 1} is ready!`,
    );
  console.log(
    `Bot >> Started on ${globalThis.discord_client.guilds.cache.size} servers!`,
  );
  updateStatus();
  setInterval(() => {
    updateStatus();
  }, 3600000);

  for (const object of globalThis.events_listeners_links["clientReady"]) {
    object.function(...object.params);
  }
}

async function updateStatus() {
  globalThis.discord_client.user.setPresence({
    activities: [
      {
        name: "Simulator of Life",
        type: ActivityType.Playing,
        state: `Building Better Worlds for ${(Date.now() / 1000 / 60 / 60).toFixed(2)} hour(s)`,
      },
    ],
    status: "online",
  });
}
