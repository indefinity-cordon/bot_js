import { Client, GatewayIntentBits, Collection, ShardEvents } from "discord.js";
import fs from "node:fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

if (!process.TEST_RUN) {
  globalThis.bypass_ids = process.env.BYPASS_IDS
    ? process.env.BYPASS_IDS.split(",")
    : [];
}

if (!Array.isArray(globalThis.bypass_ids)) globalThis.bypass_ids = [];
globalThis.events_listeners_links = {};

globalThis.discord_client = new Client({
  autoReconnect: true,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  restTimeOffset: 0,
});

globalThis.discord_client.commands = new Collection();

//LOGS
globalThis.logWithID = function (deepth = 3) {
  const stack = new Error().stack.split("\n");
  const stackLine = stack[deepth] || stack[stack.length - 1];
  const match =
    stackLine.match(/\((.*):(\d+):(\d+)\)/) ||
    stackLine.match(/at (.*):(\d+):(\d+)/);

  if (match) {
    const filePath = match[1];
    const line = match[2];
    return `[${filePath}-${globalThis.git_commit?.hash || "0"}-${line}]`;
  }
  return `[unknown-${globalThis.git_commit?.hash || "0"}-unknown]`;
};

const LogsHandlerClass = (await import("./~LogsHandler.js")).default;
globalThis._LogsHandler = new LogsHandlerClass();

globalThis._LogsHandler.setNewWebhook(
  process.env.WEBHOOK_ID,
  process.env.WEBHOOK_TOKEN,
);

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  globalThis._LogsHandler.error(
    error,
    "Unhandled promise rejection",
    globalThis.logWithID(4),
    "error",
  );
});

process.on("uncaughtException", (error) => {
  console.log("uncaughtException:", error);
  globalThis._LogsHandler.error(
    error,
    "New critical error found",
    globalThis.logWithID(4),
    "critical error",
  );
});

process.on("warning", (error) => {
  console.warn("Warning:", error);
  globalThis._LogsHandler.error(
    error,
    "New warning found",
    globalThis.logWithID(4),
    "warning",
  );
});

globalThis.discord_client.on(ShardEvents.Error, (error) => {
  console.log(error);
  globalThis._LogsHandler.error(
    error,
    "A websocket connection encountered an error",
    globalThis.logWithID(4),
    "error",
  );
});

globalThis.custom_error_log = async function (string, error) {
  console.error(string, error);
  globalThis._LogsHandler.error(
    error,
    string,
    globalThis.logWithID(4),
    "error",
  );
};
//LOGS END

if (process.TEST_RUN) {
  globalThis.main_frame = true;
  if (process.env.GITHUB_BRANCH) {
    (await import("./~GitHub.js")).default();
  }
} else {
  globalThis.main_frame = globalThis.discord_client.shard.ids[0] === 0;
}

process.on("SIGTERM", async () => {
  await globalThis.discord_client.destroy();
  process.exit(0);
});

async function initializeBot() {
  if (process.env.DB_CONNECTION_STRING_BOT) {
    (await import("./database/MySQL.js")).default(true);
  }
  if (process.env.REDIS_STRING) {
    (await import("./database/Redis.js")).default();
  }

  await globalThis.database;

  globalThis.handling_commands_actions = {};
  globalThis.handling_commands = [];

  const dirs = fs.readdirSync("./handlers");
  for (const dir of dirs) {
    const handlers = fs
      .readdirSync(`./handlers/${dir}`)
      .filter((f) => f.endsWith(".js"));
    for (const handler of handlers) {
      (await import(`./handlers/${dir}/${handler}`)).default();
    }
  }

  await globalThis.discord_client.login(process.env.DISCORD_TOKEN);

  globalThis.guilds_link = {};
  globalThis.servers_link = {};
  if (globalThis.database) {
    (await import("./server_modules/servers_actions.js")).default();
  }
  //Когда-нибудь я сделаю бота с софт ребутом, но мне лень, там начинается хтонический ужас, прямо как я.
  //setInterval(async () => require('./server_modules/servers_actions.js')(), 120 * 60000);
  if (process.TEST_RUN) globalThis.initialized = true;
}

initializeBot();
