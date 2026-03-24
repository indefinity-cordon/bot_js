import { Events } from "discord.js";
import fs from "node:fs";

export default async function loadEvents() {
  if (globalThis.main_frame) console.log("\u001b[0m");
  if (globalThis.main_frame) console.log("System >> Loading events ...");
  if (globalThis.main_frame) console.log("\u001b[0m");

  const events = fs
    .readdirSync("./events")
    .filter((files) => files.endsWith(".js"));

  if (globalThis.main_frame)
    console.log(`System >> ${events.length} events loaded`);

  for (const file of events) {
    const event_module = await import(`${process.cwd()}/events/${file}`);
    const event = event_module.default || event_module;
    const eventName = file.split(".")[0];
    globalThis.events_listeners_links[eventName] = [];
    const eventUpperCase =
      eventName.charAt(0).toUpperCase() + eventName.slice(1);
    if (Events[eventUpperCase] === undefined) {
      globalThis.discord_client.on(eventName, event).setMaxListeners(0);
    } else {
      globalThis.discord_client
        .on(Events[eventUpperCase], event)
        .setMaxListeners(0);
    }
  }
}
