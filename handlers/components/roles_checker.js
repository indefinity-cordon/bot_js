export default async function roles() {
  globalThis.discord_client.serverRoles = async function (game_server) {
    setTimeout(updateRoles, 10000, game_server);
    game_server.update_roles_interval = setInterval(
      updateRoles,
      30 * 60000,
      game_server,
    );
  };
}

//TODO: Перенести в объект дискорда, т.к. это полностью относится к дополнительному по дискорд серверному функционалу (он был теперь прописан)
async function updateRoles(game_server) {
  let db_roles, db_links, guild;

  if (!game_server.game_connection) return;

  async function loadUp() {
    db_roles = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT role_id, rank_id FROM discord_ranks",
    );
    if (!db_roles?.length) return "No discord ranks";

    guild = globalThis.discord_client.guilds.cache.get(
      game_server.linked_guild.data.guild_id,
    );
    if (!guild) return "No guild";

    db_links = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT discord_id, stable_rank FROM discord_links",
    );
    if (!db_links.length) return "No discord links";
  }

  const result = await loadUp();
  if (result) {
    console.log("Roles >> [ERROR] >>", result);
    return;
  }

  const rolesMap = new Map();
  db_roles.forEach((row) => {
    rolesMap.set(row.role_id, row.rank_id);
  });
  const discordLinksMap = new Map();
  db_links.forEach((link) => {
    discordLinksMap.set(link.discord_id, link.stable_rank);
  });

  const updates = []; //База кормит
  async function callBack(members) {
    for (const member of members.values()) {
      const stable_rank = discordLinksMap.get(member.id);
      if (stable_rank === undefined) continue;

      let rank_id = stable_rank;
      member.roles.cache.forEach((role) => {
        const roleRankId = rolesMap.get(role.id);
        if (roleRankId && rank_id < roleRankId) {
          rank_id = roleRankId;
        }
      });

      if (rank_id != stable_rank) {
        updates.push([rank_id, member.id]);
      }
    }
  }

  await globalThis.fetchMembers(guild, callBack);
  if (!updates.length) return;

  for (const [rank_id, discord_id] of updates) {
    globalThis.mysqlRequest(
      game_server.game_connection,
      "UPDATE discord_links SET role_rank = ? WHERE discord_id = ?",
      [rank_id, discord_id],
    );
  }
}
