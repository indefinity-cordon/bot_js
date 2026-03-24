import { ShardingManager } from "discord.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const manager = new ShardingManager("./bot.js", {
  token: process.env.DISCORD_TOKEN,
  respawn: true,
  totalShards: 1, // Not required for now, because multi shard system handled wrong and don't need right now if we can't easy manage guilds flow, plus this bot only for small amount of guilds and for now it's fine as it, need to fix later and add system guilds cover detection to load only required data
});

console.clear();
console.log("System >> Starting up ...");
console.log("\u001b[0m");
console.log("© Skill Issuers Incorporated 0000 -", new Date().getFullYear()); //Тебе надо тренироваться, что бы твои тренировки окупились салага! Ваш юмор так низок, что он уже является туалетным!
console.log("All rights sucked up");

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

globalThis._LogsHandler = new (await import("./~LogsHandler.js")).default();

globalThis._LogsHandler.setNewWebhook(
  process.env.WEBHOOK_ID,
  process.env.WEBHOOK_TOKEN,
);

manager.on("shardCreate", (shard) => {
  console.log(`System >> Starting Shard #${shard.id + 1} ...`);
  globalThis._LogsHandler.sendSimplyLog("System", null, " ", [
    { name: "Shard", value: `Starting Shard #${shard.id + 1} ...` },
  ]);

  shard.on("death", (process) => {
    console.log(`System >> Death Shard #${shard.id + 1} ...`);
    globalThis._LogsHandler.sendSimplyLog(
      "System",
      null,
      globalThis.logWithID(4),
      [{ name: "Shard", value: `Death Shard #${shard.id + 1} ...` }],
    );
    if (process.exitCode === null) {
      console.log(`System >> Exited With NULL Shard #${shard.id + 1} ...`);
      globalThis._LogsHandler.sendSimplyLog(
        "System",
        null,
        globalThis.logWithID(4),
        [
          {
            name: "Shard",
            value: `Exited With NULL Shard #${shard.id + 1} ...`,
          },
        ],
      );
    }
  });

  shard.on("shardDisconnect", () => {
    console.log(`System >> Disconnected Shard #${shard.id + 1} ...`);
    globalThis._LogsHandler.sendSimplyLog(
      "System",
      null,
      globalThis.logWithID(4),
      [{ name: "Shard", value: `Disconnected Shard #${shard.id + 1} ...` }],
    );
  });

  shard.on("shardReconnecting", () => {
    console.log(`System >> Reconnecting Shard #${shard.id + 1} ...`);
    globalThis._LogsHandler.sendSimplyLog(
      "System",
      null,
      globalThis.logWithID(4),
      [{ name: "Shard", value: `Reconnecting Shard #${shard.id + 1} ...` }],
    );
  });
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  globalThis._LogsHandler.error(
    error,
    "Unhandled promise rejection",
    globalThis.logWithID(4),
    "error",
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

globalThis.custom_error_log = async function (string, error) {
  console.log(string, error);
  globalThis._LogsHandler.error(
    error,
    string,
    globalThis.logWithID(4),
    "error",
  );
};
//LOGS END

if (process.env.GITHUB_BRANCH) {
  (await import("./~GitHub.js")).default();
}

globalThis.restartApp = async function (reason) {
  console.log("System >> App ... Restarting process ...");
  await globalThis._LogsHandler.sendSimplyLog(
    "System",
    null,
    globalThis.logWithID(4),
    [{ name: "Restart", value: reason ? `Reason: ${reason}` : "Unspecified" }],
  );

  manager.shards.map((shard) => shard.kill("SIGTERM"));
  process.exit(1);
};

async function runStartUp() {
  manager.spawn();

  console.log("\u001b[0m");
  console.log("\u001b[0m");
  console.log(
    "System >> Loaded Version",
    (
      await import(`${process.cwd()}/package.json`, {
        assert: { type: "json" },
      })
    ).default.version,
  );
  console.log("\u001b[0m");
}

runStartUp().catch((error) => {
  globalThis.custom_error_log("Failed to start shards:", error);
});
