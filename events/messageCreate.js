export default async function messageCreate(message) {
  if (message.author.bot) return;

  if (
    await globalThis.discord_client.HasPermsWriteAccess(message.channel, false)
  )
    return;

  for (const object of globalThis.events_listeners_links["messageCreate"]) {
    object.function(message, ...object.params);
  }
}
