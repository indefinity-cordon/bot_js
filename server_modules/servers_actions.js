//О великий аллах, приди и помоги же мне разобрать свой говнолегасикод, я люблю его переписывать, но есть некоторые сожаления!
export default async function declareServerActions() {
  const guilds = await globalThis.gather_data(
    globalThis.database,
    "Guild",
    "SELECT * FROM ##TABLE##",
  );
  if (guilds.length) {
    let updated_guilds = {};

    for (const guild of guilds) {
      await guild.sync();
      await guild.load_parent();

      updated_guilds[`${guild.data.guild_id}`] = guild;

      if (!guild.modules["WhoMeme"] && guild.settings_data.whomeme)
        (await import(`./guilds_components/responde_on_who_smth.js`)).default(
          guild,
        );
      if (!guild.modules["Pizda"] && guild.settings_data.pizda)
        (await import(`./guilds_components/responde_on_da.js`)).default(guild);
      if (
        !guild.modules["Messages"] &&
        guild.settings_data.funny_messages_function
      )
        (await import(`./guilds_components/messages.js`)).default(guild);
    }
    globalThis.guilds_link = updated_guilds;
  } else {
    console.log("Failed to find guilds. Aborting.");
  }

  const servers = await globalThis.gather_data(
    globalThis.database,
    "Server",
    "SELECT * FROM ##TABLE##",
  );
  if (servers.length) {
    let updated_servers = {};

    for (const game_server of servers) {
      if (!(game_server.data.server_name in globalThis.servers_link)) {
        await game_server.sync();
        await game_server.load_parent();

        for (const guild_id in globalThis.guilds_link) {
          if (globalThis.guilds_link[guild_id].id != game_server.data.guild)
            continue;
          game_server.linked_guild = globalThis.guilds_link[guild_id];
          break;
        }
        if (
          game_server.data.tgs_address &&
          game_server.data.tgs_login &&
          game_server.data.tgs_pass
        ) {
          const data = await globalThis.discord_client.tgs_getInstance(
            game_server.data.tgs_address,
            game_server.data.tgs_login,
            game_server.data.tgs_pass,
            game_server.data.tgs_id,
          );
          if (data) game_server.instance_name = data.name;
        }
        globalThis.discord_client.createByondChannel(game_server);
        if (game_server.data.db_connection_string)
          game_server.game_connection = await globalThis.mysqlCreate(
            game_server.data.db_connection_string,
          );
        if (game_server.data.file_name)
          (await import(`./servers/${game_server.data.file_name}`)).default(
            game_server,
          );
      }
      updated_servers[`${game_server.data.server_name}`] = game_server;
      if (
        game_server.data.file_name &&
        !game_server.update_status_messages_interval
      ) {
        game_server.message_updater_intervals = {};
        globalThis.discord_client.serverMessageUpdator(game_server);
      }
      if (game_server.data.guild && !game_server.update_roles_interval) {
        globalThis.discord_client.serverRoles(game_server);
      }
      if (
        game_server.data.file_name &&
        !game_server.update_custom_operatos_interval
      ) {
        game_server.serverCustomOperators();
      }
    }
    globalThis.servers_link = updated_servers;
  } else {
    console.log("Failed to find servers. Aborting.");
  }
}
