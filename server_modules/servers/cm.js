import { EmbedBuilder } from "discord.js";
// legacy shit
let announced_start = false;
export default async function declareCM(game_server) {
  let failed_times = 0;

  game_server.updateStatusMessage = async function (type) {
    try {
      const server_response = await game_server.byond_channel.request(
        {
          query: "status_authed",
          auth: game_server.settings_data.topic_token.data.setting,
        },
        { retries: 1, timeout: 10 * 1000 },
      );
      if (!server_response) throw "Returned no response";

      failed_times = 0;
      const time = Math.floor(server_response.data.round_duration / 600);
      const fields = [
        {
          name: "**Round Name**",
          value: `${server_response.data.round_name} `,
          inline: true,
        },
        {
          name: "**Round ID**",
          value: `${server_response.data.round_id} `,
          inline: true,
        },
        {
          name: "**Map**",
          value: `${server_response.data.map_name} `,
          inline: true,
        },
      ];
      if (server_response.data.next_map_name)
        fields.push({
          name: "**Next Map**",
          value: `${server_response.data.next_map_name} `,
          inline: true,
        });
      fields.push({
        name: "**Ship Map**",
        value: `${server_response.data.ship_map_name} `,
        inline: true,
      });
      if (server_response.data.next_ship_map_name)
        fields.push({
          name: "***Next Ship Map**",
          value: `${server_response.data.next_ship_map_name} `,
          inline: true,
        });
      fields.push(
        {
          name: "**Total Players**",
          value: `${server_response.data.players} `,
          inline: true,
        },
        {
          name: "**Gamemode**",
          value: `${server_response.data.mode}`,
          inline: true,
        },
        {
          name: "**Round Time**",
          value: `${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, "0"),
          inline: true,
        },
      );
      if (server_response.data.round_end_state)
        fields.push({
          name: "**Rouned End State**",
          value: `${server_response.data.round_end_state} `,
          inline: true,
        });
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: [
              new EmbedBuilder()
                .setTitle(" ")
                .addFields(fields)
                .setColor("#669917")
                .setTimestamp(),
            ],
            content: `${game_server.data.server_name} Status${server_response.data.delay ? " [DELAYED]" : ""}`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    } catch {
      if (failed_times > 12) {
        game_server.handle_status(0);
        failed_times = 0;
      } else failed_times++;
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: [
              new EmbedBuilder()
                .setTitle(" ")
                .setDescription("# SERVER OFFLINE")
                .setColor("#a00f0f")
                .setTimestamp(),
            ],
            content: `${game_server.data.server_name} Status`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    }
  };

  game_server.updateStatistic = async function (type) {
    try {
      const db_request_maps = await globalThis.mysqlRequest(
        game_server.game_connection,
        "SELECT * FROM maps",
      );
      const fields = [];
      for (const map of db_request_maps) {
        if (!map.total_victories || !isJsonString(map.total_victories))
          continue;
        const parsed_winrate = JSON.parse(map.total_victories);
        let winrate = "";
        for (const win in parsed_winrate) {
          winrate += `${win}: ${parsed_winrate[win]}\n`;
        }
        fields.push({
          name: `**${map.map_name}**`,
          value: winrate || "Waiting for data",
          inline: true,
        });
      }
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: [
              new EmbedBuilder()
                .setTitle(" ")
                .addFields(fields)
                .setColor("#669917")
                .setTimestamp(),
            ],
            content: `${game_server.data.server_name} Winrate`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    } catch {
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: [
              new EmbedBuilder()
                .setTitle(" ")
                .setDescription("something went wrong")
                .setColor("#a00f0f")
                .setTimestamp(),
            ],
            content: `${game_server.data.server_name} Winrate`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    }
  };

  game_server.updateScheduleMessage = async function (type) {
    try {
      if (!game_server.settings_data.auto_start_config) throw "Setup schedule";

      const server_schedule_data = await getSchedule(
        game_server.settings_data.auto_start_config.param,
      );
      if (!server_schedule_data)
        throw "Something went wrong in getSchedule moduel";

      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: [
              new EmbedBuilder()
                .setTitle(" ")
                .setDescription(server_schedule_data)
                .setColor("#669917")
                .setTimestamp(),
            ],
            content: `${game_server.data.server_name} Start Schedule`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    } catch {
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: [
              new EmbedBuilder()
                .setTitle(" ")
                .setDescription("something went wrong")
                .setColor("#a00f0f")
                .setTimestamp(),
            ],
            content: `${game_server.data.server_name} Start Schedule`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    }
  };

  game_server.updateAdminsMessage = async function (type) {
    try {
      const db_request_admin = await globalThis.mysqlRequest(
        game_server.game_connection,
        "SELECT player_id, rank_id, extra_titles_encoded FROM admins",
      );
      const player_ids = db_request_admin.map((admin) => admin.player_id);
      const db_request_profiles = await globalThis.mysqlRequest(
        game_server.game_connection,
        `SELECT id, ckey, last_login FROM players WHERE id IN (${player_ids.join(",")})`,
      );
      const profileMap = new Map();
      db_request_profiles.forEach((profile) => {
        profileMap.set(profile.id, profile);
      });
      const db_request_ranks = await globalThis.mysqlRequest(
        game_server.game_connection,
        "SELECT id, rank_name, text_rights FROM admin_ranks",
      );
      const roleMap = new Map();
      db_request_ranks.forEach((row) => {
        roleMap.set(row.id, row.rank_name);
      });

      ///EMBED CONSTRUCTOR
      const embeds = [];
      let description = "";
      let embed_description = "";
      let fields = [];

      const checkEmbedPart = () => {
        if (description.length > 824) {
          fields.push({ name: " ", value: description });
          description = "";
        } else if (description.length > 3896) {
          embed_description = description;
          description = "";
        }
        if (fields.length == 25) {
          embeds.push(
            new EmbedBuilder()
              .setTitle(" ")
              .setDescription(embed_description)
              .addFields(fields)
              .setColor("#669917"),
          );
          embed_description = "";
          fields = [];
        }
      };

      const addEmbedPart = () => {
        if (description.length) {
          if (embed_description.length) {
            fields.push({ name: " ", value: description });
            description = "";
          } else {
            embed_description = description;
            description = "";
          }
        }

        if (fields.length || embed_description.length) {
          embeds.push(
            new EmbedBuilder()
              .setTitle(" ")
              .setDescription(embed_description || " ")
              .addFields(fields.length ? fields : [{ name: " ", value: " " }])
              .setColor("#669917"),
          );
          fields = [];
          embed_description = "";
        }
      };
      ///

      for (const db_admin of db_request_admin) {
        const profile = profileMap.get(db_admin.player_id);
        if (!profile) continue;

        let extra_ranks = [];
        if (db_admin.extra_titles_encoded) {
          extra_ranks = JSON.parse(db_admin.extra_titles_encoded).map(
            (rank_id) => roleMap.get(Number.parseInt(rank_id)),
          );
        }
        description += `**Ckey:** ${profile.ckey} [Last Login ${profile.last_login}]\n**Rank:** ${roleMap.get(db_admin.rank_id)}`;
        if (extra_ranks.length) {
          description += ` [Extra Ranks ${extra_ranks.join(" & ")}]`;
        }
        description += "\n\n";
        checkEmbedPart();
      }
      addEmbedPart();

      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: embeds,
            content: `${game_server.data.server_name} Actual Admins`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    } catch {
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.embed(
          {
            content: `${game_server.data.server_name} Actual Admins`,
            title: "",
            desc: "# ERROR",
            color: "#a00f0f",
            type: "edit",
          },
          message,
        );
      }
    }
  };

  game_server.updateRanksMessage = async function (type) {
    try {
      const db_request = await globalThis.mysqlRequest(
        game_server.game_connection,
        "SELECT id, rank_name, text_rights FROM admin_ranks",
      );
      const embeds = [];
      let description = "";
      for (const db_rank of db_request) {
        const rank_fields = db_rank.text_rights.split("|");
        description += `**${db_rank.rank_name}**\n`;
        description += `${rank_fields.join(" & ")}\n\n`;
      }
      embeds.push(
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(description)
          .setColor("#669917"),
      );
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: embeds,
            content: `${game_server.data.server_name} Actual Ranks`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    } catch {
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.embed(
          {
            content: `${game_server.data.server_name} Actual Ranks`,
            title: "",
            desc: "# ERROR",
            color: "#a00f0f",
            type: "edit",
          },
          message,
        );
      }
    }
  };

  game_server.updateWhitelistsMessage = async function (type) {
    try {
      const db_request = await globalThis.mysqlRequest(
        game_server.game_connection,
        "SELECT id, ckey, whitelist_status FROM players WHERE whitelist_status != ''",
      );
      const acting_wls = {
        Commander: [
          "WHITELIST_COMMANDER",
          "WHITELIST_COMMANDER_COUNCIL",
          "WHITELIST_COMMANDER_COUNCIL_LEGACY",
          "WHITELIST_COMMANDER_COLONEL",
          "WHITELIST_COMMANDER_LEADER",
        ],
        Synthetic: [
          "WHITELIST_SYNTHETIC",
          "WHITELIST_SYNTHETIC_COUNCIL",
          "WHITELIST_SYNTHETIC_COUNCIL_LEGACY",
          "WHITELIST_SYNTHETIC_LEADER",
          "WHITELIST_JOE",
        ],
        Yautja: [
          "WHITELIST_YAUTJA",
          "WHITELIST_YAUTJA_LEGACY",
          "WHITELIST_YAUTJA_COUNCIL",
          "WHITELIST_YAUTJA_COUNCIL_LEGACY",
          "WHITELIST_YAUTJA_LEADER",
        ],
      };
      const replacements = {
        Commander: {
          WHITELIST_COMMANDER: "CO",
          WHITELIST_COMMANDER_COUNCIL: "CO Council",
          WHITELIST_COMMANDER_COUNCIL_LEGACY: "CO Council Legacy",
          WHITELIST_COMMANDER_COLONEL: "Colonel",
          WHITELIST_COMMANDER_LEADER: "CO Leader",
        },
        Synthetic: {
          WHITELIST_SYNTHETIC: "Synthetic",
          WHITELIST_SYNTHETIC_COUNCIL: "Synthetic Council",
          WHITELIST_SYNTHETIC_COUNCIL_LEGACY: "Synthetic Council Legacy",
          WHITELIST_SYNTHETIC_LEADER: "Synthetic Leader",
          WHITELIST_JOE: "Joe",
        },
        Yautja: {
          WHITELIST_YAUTJA: "Yautja",
          WHITELIST_YAUTJA_LEGACY: "Yautja Legacy",
          WHITELIST_YAUTJA_COUNCIL: "Yautja Council",
          WHITELIST_YAUTJA_COUNCIL_LEGACY: "Yautja Council Legacy",
          WHITELIST_YAUTJA_LEADER: "Yautja Leader",
        },
      };
      const embeds = [];
      for (const type in acting_wls) {
        let fields = [];
        const grouped_players = {};
        for (const wl_name of acting_wls[type]) {
          grouped_players[wl_name] = [];
        }
        for (const player of db_request) {
          const wl_fields = player.whitelist_status.split("|");
          const actual_wl_fields = wl_fields.filter((field) =>
            acting_wls[type].includes(field),
          );
          for (const wl_fields of actual_wl_fields) {
            grouped_players[wl_fields].push(player.ckey);
          }
        }
        for (const [status, players] of Object.entries(grouped_players)) {
          if (!players.length) continue;
          fields.push({
            name: `**${replacements[type][status]}**`,
            value: players.join(", "),
            inline: true,
          });
        }
        if (fields.length)
          embeds.push(
            new EmbedBuilder()
              .setTitle(" ")
              .addFields(fields)
              .setColor("#669917"),
          );
      }
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: embeds,
            content: `${game_server.data.server_name} Actual Whitelists`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    } catch {
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.embed(
          {
            content: `${game_server.data.server_name} Actual Whitelists`,
            title: "",
            desc: "# ERROR",
            color: "#a00f0f",
            type: "edit",
          },
          message,
        );
      }
    }
  };

  game_server.handling_updaters = {
    message_status: game_server.updateStatusMessage,
    message_statistic: game_server.updateStatistic,
    message_schedule: game_server.updateScheduleMessage,
    message_admin: game_server.updateAdminsMessage,
    message_rank: game_server.updateRanksMessage,
    message_whitelist: game_server.updateWhitelistsMessage,
  };

  ////////////////////////////////////////////////////////////////////////////////
  /////////////////////////// END OF HANDLING UPDATERS ///////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  game_server.do_verification = async function (interaction, user_identifier) {
    if (await game_server.check_verification(interaction, true))
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: "You already verified",
          color: "#669917",
        },
        interaction,
      );

    let request = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT playerid, realtime, used FROM discord_identifiers WHERE identifier = ?",
      [user_identifier],
    );
    const selected_identifier = request[0];
    if (!selected_identifier || selected_identifier.used)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Verification", desc: "Wrong identifier", color: "#c70058" },
        interaction,
      );
    else if (
      selected_identifier.realtime + 240 * 60000 <
      new Date().toLocaleTimeString()
    )
      return globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: "Time run out, order new in game",
          color: "#c70058",
        },
        interaction,
      );

    request = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT player_id, discord_id FROM discord_links WHERE player_id = ?",
      [selected_identifier.playerid],
    );
    const selected_link = request[0];
    if (selected_link && selected_link.discord_id)
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: "You already verified",
          color: "#669917",
        },
        interaction,
      );
    else {
      if (selected_link) {
        await globalThis.mysqlRequest(
          game_server.game_connection,
          "UPDATE discord_links SET discord_id = ? WHERE player_id = ?",
          [interaction.user.id, selected_identifier.playerid],
        );
      } else {
        await globalThis.mysqlRequest(
          game_server.game_connection,
          "INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)",
          [selected_identifier.playerid, interaction.user.id],
        );
      }
      await globalThis.mysqlRequest(
        game_server.game_connection,
        "UPDATE discord_identifiers SET used = 1 WHERE identifier = ?",
        [user_identifier],
      );

      await game_server.check_verification(interaction, true);
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: "You successfully verified",
          color: "#669917",
        },
        interaction,
      );
    }
  };

  game_server.check_verification = async function (
    interaction,
    silent = false,
  ) {
    const request = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT * FROM discord_links WHERE discord_id = ?",
      [interaction.user.id],
    );
    const selected_identifier = request[0];
    if (!selected_identifier || !selected_identifier.discord_id) {
      if (!silent)
        await globalThis.discord_client.ephemeralEmbedEdit(
          {
            title: "Verification",
            desc: "You need to verify, you don't have linked game account",
            color: "#c70058",
          },
          interaction,
        );
      return 0;
    }

    const guild = globalThis.guilds_link[`${interaction.guildId}`];
    if (
      guild &&
      guild.settings_data.verified_role &&
      guild.settings_data.anti_verified_role
    ) {
      const interactionUser = await interaction.guild.members.fetch(
        interaction.user.id,
      );
      interactionUser.roles.add(guild.settings_data.verified_role.data.setting);
      interactionUser.roles.remove(
        guild.settings_data.anti_verified_role.data.setting,
      );
    }

    if (!silent)
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: "You already verified",
          color: "#669917",
        },
        interaction,
      );
    return 1;
  };

  game_server.infoRequest = async function (interaction) {
    const target_user = interaction.options.getUser("user");
    let request = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?",
      [target_user.id],
    );
    const selected_link = request[0];
    if (!selected_link || !selected_link.discord_id)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "This user does not have a linked game profile",
          color: "#c70058",
        },
        interaction,
      );

    let rank_info = "";
    if (selected_link.role_rank) {
      request = await globalThis.mysqlRequest(
        game_server.game_connection,
        "SELECT rank_name FROM discord_ranks WHERE rank_id = ?",
        [selected_link.role_rank],
      );
      const selected_role = request[0];
      let db_stable_role;
      if (selected_link.stable_rank != selected_link.role_rank) {
        db_stable_role = await globalThis.mysqlRequest(
          game_server.game_connection,
          "SELECT rank_name FROM discord_ranks WHERE rank_id = ?",
          [selected_link.stable_rank],
        );
      }
      if (selected_link.stable_rank && !db_stable_role) {
        rank_info += `**[SPECIAL] Supported Rank:** ${selected_role.rank_name}\n`;
      } else {
        if (db_stable_role) {
          rank_info += `**[SPECIAL] Supported Rank:** ${selected_role.rank_name}\n`;
        }
        rank_info = `**Supported Rank:** ${selected_role.rank_name}\n`;
      }
    }
    request = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT id, ckey, last_login, is_permabanned, permaban_reason, permaban_date, permaban_admin_id, is_time_banned, time_ban_reason, time_ban_expiration, time_ban_admin_id, time_ban_date FROM players WHERE id = ?",
      [selected_link.player_id],
    );
    const selected_player = request[0];
    if (!selected_player)
      return globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "This is user don't have CM profile",
          color: "#c70058",
        },
        interaction,
      );

    let player_info = `**Last login:** ${selected_player.last_login}\n`;
    if (selected_player.is_permabanned) {
      player_info += `## **Permabanned**\n**Reason:** ${selected_player.permaban_reason}, **Date:** ${selected_player.permaban_date}\n`;
    } else if (selected_player.is_time_banned) {
      player_info += `## **Banned**\n**Reason:** ${selected_player.time_ban_reason}, **Exp:** ${selected_player.time_ban_expiration}, **Date:** ${selected_player.time_ban_date}\n`;
    }
    const db_player_playtime = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT role_id, total_minutes FROM player_playtime WHERE player_id = ?",
      [selected_player.id],
    );
    let player_playtime = 0;
    for (const playtime of db_player_playtime) {
      player_playtime += playtime.total_minutes;
    }
    request = await globalThis.mysqlRequest(
      game_server.game_connection,
      "SELECT rank_id, extra_titles_encoded FROM admins WHERE player_id = ?",
      [selected_player.id],
    );
    const selected_admin = request[0];
    if (selected_admin) {
      const db_request_ranks = await globalThis.mysqlRequest(
        game_server.game_connection,
        "SELECT id, rank_name, text_rights FROM admin_ranks",
      );
      const roleMap = new Map();
      db_request_ranks.forEach((row) => {
        roleMap.set(row.id, row.rank_name);
      });

      player_info += `**Rank:** ${roleMap.get(selected_admin.rank_id)}\n`;
      let extra_ranks = [];
      if (selected_admin.extra_titles_encoded) {
        extra_ranks = JSON.parse(selected_admin.extra_titles_encoded).map(
          (rank_id) => roleMap.get(Number.parseInt(rank_id)),
        );
      }
      if (extra_ranks.length)
        player_info += `**Extra Ranks:** ${extra_ranks.join(" & ")}`;
    }
    await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: `**${selected_link.role_rank ? "HIDDEN" : selected_player.ckey}** player info`,
        desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`,
        color: "#c70058",
      },
      interaction,
    );
  };

  game_server.managePlayer = async function (interaction) {
    const result = await findPlayerByCkey(interaction, game_server);
    if (!Array.isArray(result)) return;

    const [ckey, player_data, selected_player_id] = result;

    const selected_action =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Action",
        [
          { label: "Play Time", value: "playtime" },
          { label: "Notes", value: "notes" },
          { label: "Check Battlepass", value: "battlepass" },
        ],
        "Choose an action:",
      );
    if (!selected_action) return;

    const handling_options = {
      playtime: checkPT,
      notes: checkNotes,
      battlepass: checkBP,
    };
    await handling_options[selected_action](
      interaction,
      game_server,
      ckey,
      player_data,
      selected_player_id,
    );
  };

  game_server.manageBattlepass = async function (interaction) {
    const selected_action =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Action",
        [
          { label: "Look Up Rewards (WIP)", value: "rewards" },
          { label: "Look Up Battlepass Seasons (WIP)", value: "seasons" },
          { label: "Add Rewards (WIP)", value: "add_reward" },
          {
            label: "Remove Rewards (WIP) (CAUTION DA)",
            value: "remove_reward",
          },
          { label: "Add New Season (WIP)", value: "add_season" },
          { label: "Edit Season (WIP) (CAUTION DA)", value: "edit_season" },
        ],
        "Choose an action:",
      );
    if (!selected_action) return;

    const handling_options = {
      rewards: checkBPRewards,
      seasons: checkBPSeason,
      add_reward: addBPReward,
      remove_reward: removeBPReward,
      add_season: addBPSeason,
      edit_season: editBPSeason,
    };
    await handling_options[selected_action](interaction, game_server);
  };

  game_server.manageAdmins = async function (interaction) {
    const selected_action =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Action",
        [
          { label: "Add Admin", value: "add" },
          { label: "Remove Admin", value: "remove" },
          { label: "Update Admin", value: "update" },
        ],
        "Choose an action for admin management:",
      );
    if (!selected_action) return;

    const handling_options = {
      add: manageAddAdmin,
      remove: manageRemoveAdmin,
      update: manageUpdateAdmin,
    };
    await handling_options[selected_action](interaction, game_server);
  };

  game_server.manageRanks = async function (interaction) {
    const selected_action =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Action",
        [
          { label: "Add Rank", value: "add" },
          { label: "Remove Rank", value: "remove" },
          { label: "Update Rank", value: "update" },
        ],
        "Choose an action for rank management:",
      );
    if (!selected_action) return;

    const handling_options = {
      add: manageAddRank,
      remove: manageRemoveRank,
      update: manageUpdateRank,
    };
    await handling_options[selected_action](interaction, game_server);
  };

  game_server.manageWhitelists = async function (interaction) {
    const selected_action =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Action",
        [
          { label: "Add Whitelists", value: "add" },
          { label: "Remove Whitelists", value: "remove" },
        ],
        "Choose an action for rank management:",
      );
    if (!selected_action) return;

    const acting_wls = {
      WHITELIST_COMMANDER: "CO",
      WHITELIST_COMMANDER_COUNCIL: "CO Council",
      WHITELIST_COMMANDER_COUNCIL_LEGACY: "CO Council Legacy",
      WHITELIST_COMMANDER_COLONEL: "Colonel",
      WHITELIST_COMMANDER_LEADER: "CO Leader",
      WHITELIST_SYNTHETIC: "Synthetic",
      WHITELIST_SYNTHETIC_COUNCIL: "Synthetic Council",
      WHITELIST_SYNTHETIC_COUNCIL_LEGACY: "Synthetic Council Legacy",
      WHITELIST_SYNTHETIC_LEADER: "Synthetic Leader",
      WHITELIST_JOE: "Joe",
      WHITELIST_YAUTJA: "Yautja",
      WHITELIST_YAUTJA_LEGACY: "Yautja Legacy",
      WHITELIST_YAUTJA_COUNCIL: "Yautja Council",
      WHITELIST_YAUTJA_COUNCIL_LEGACY: "Yautja Council Legacy",
      WHITELIST_YAUTJA_LEADER: "Yautja Leader",
    };
    const handling_options = {
      add: manageAddWhitelist,
      remove: manageRemoveWhitelist,
    };
    await handling_options[selected_action](
      interaction,
      game_server,
      acting_wls,
    );
  };

  game_server.serverCustomOperators = async function () {
    await updateServerCustomOperators(game_server);
    game_server.update_custom_operatos_interval = setInterval(
      updateServerCustomOperators,
      60 * 60000,
      game_server,
    );
  };

  game_server.configureAutoStartMenu = async function (interaction) {
    if (!game_server.settings_data.auto_start_config) {
      game_server.settings_data.auto_start_config =
        new globalThis.entity_construct["ServerSettings"](
          globalThis.database,
          null,
          globalThis.entity_meta["ServerSettings"],
        );
      await game_server.settings_data.auto_start_config.sync();
    }
    const selected_action =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Action",
        [
          { label: "View Schedule", value: "view" },
          { label: "Set Mode", value: "set_mode" },
          { label: "Set Daily Times", value: "set_daily_time" },
          { label: "Remove Daily Times", value: "remove_daily_time" },
          { label: "Set Specific Days", value: "set_specific_days" },
          { label: "Remove Specific Days", value: "remove_specific_days" },
        ],
        "Configure the automatic server start system:",
      );
    if (!selected_action) return;

    const handling_options = {
      view: viewSchedule,
      set_mode: setMode,
      set_daily_time: setDailyTimes,
      remove_daily_time: removeDailyTimes,
      set_specific_days: setSpecificDays,
      remove_specific_days: removeSpecificDays,
    };
    await handling_options[selected_action](
      interaction,
      game_server,
      game_server.settings_data.auto_start_config.param,
    );
  };

  game_server.tgsActions = async function (interaction) {
    const collected = await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Action",
      globalThis.discord_client.handling_tgs,
      "Please select action to perform:",
    );
    if (collected) {
      globalThis.createLog(
        `${interaction.user.id} command: [${collected}]`,
        game_server,
      );
      const response_data =
        await globalThis.discord_client.handling_tgs_actions[collected](
          game_server.data.tgs_address,
          game_server.data.tgs_login,
          game_server.data.tgs_pass,
          game_server.data.tgs_id,
          interaction,
        );
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Action",
          desc: `${response_data.status}: ${response_data.statusText}`,
          color: "#c70058",
        },
        interaction,
      );
    }
  };

  game_server.handling_actions = {
    manage_admins: game_server.manageAdmins,
    manage_ranks: game_server.manageRanks,
    manage_whitelists: game_server.manageWhitelists,
    manage_autostart: game_server.configureAutoStartMenu,
    manage_tgs: game_server.tgsActions,
    manage_battlepass: game_server.manageBattlepass,
    player_by_ckey: game_server.managePlayer,
  };

  game_server.handling_commands = [
    { label: "Manage Admins", value: "manage_admins" },
    { label: "Manage Ranks", value: "manage_ranks" },
    { label: "Manage Whitelists", value: "manage_whitelists" },
    { label: "Manage Auto Start", value: "manage_autostart" },
    { label: "Manage TGS", value: "manage_tgs" },
    { label: "Manage Battlepass", value: "manage_battlepass" },
    { label: "Info Players", value: "player_by_ckey" },
  ];

  game_server.handledStatuses = {
    ooc: handleOOC,
    asay: handleAsay,
    stop_auto_stop: autoStopDeny,
    start: handleRoundStart,
    end: handleRoundEnd,
    ship_crash: handleShipCrash,
    distress: handleDistressBeacon,
    predator: handlePredator,
    ahelp: handleAhelp,
    add_time_ban: handleTimeBan,
    remove_time_ban: handleTimeBan,
    add_job_ban: handleJobBan,
    remove_job_ban: handleJobBan,
    add_perma_ban: handlePermaBan,
    remove_perma_ban: handlePermaBan,
    auto_unban: handleAutoUnban,
    auto_unjobban: handleAutoUnjobban,
    fax: handleFax,
    login: handleLogin,
    logout: handleLogout,
  };

  async function handleOOC(data, channel) {
    globalThis.addMessageToQueue(
      new EmbedBuilder()
        .setTitle(" ")
        .setDescription(
          `OOC: ${data.author}: ${globalThis.stripDiscordFun(data.message)}`,
        )
        .setColor("#7289da"),
      channel.id,
    );
  }

  async function handleAsay(data, channel) {
    globalThis.addMessageToQueue(
      new EmbedBuilder()
        .setTitle(" ")
        .setDescription(
          `Asay: (${data.rank}) ${data.author}: ${globalThis.stripDiscordFun(data.message)}`,
        )
        .setColor("#7289da"),
      channel.id,
    );
  }

  let deny_shutdown = false;

  async function autoStopDeny() {
    deny_shutdown = true;
  }

  async function handleRoundStart(data, channel) {
    if (!game_server.settings_data.server_status) return;
    if (await game_server.handle_status(1)) return;

    if (game_server.settings_data.player_low_autoshutdown.data.setting) {
      const server_response = await game_server.byond_channel.request(
        {
          query: "status_authed",
          auth: game_server.settings_data.topic_token.data.setting,
        },
        {},
      );
      if (server_response) {
        if (
          server_response.data.players <
          game_server.settings_data.player_low_autoshutdown.data.setting
        ) {
          await game_server.byond_channel.request(
            {
              query: "lowpop_shutdown_warning",
              auth: game_server.settings_data.topic_token.data.setting,
            },
            {},
          );
          const result = await new Promise((resolve) => {
            setTimeout(() => {
              if (deny_shutdown) {
                deny_shutdown = false;
                resolve(true);
              } else {
                game_server.handle_status(0);
                globalThis.discord_client.tgs_stop(
                  game_server.data.tgs_address,
                  game_server.data.tgs_login,
                  game_server.data.tgs_pass,
                  game_server.data.tgs_id,
                );
                resolve(false);
              }
            }, 30 * 1000);
          });
          if (!result) return;
        }
      }
    }
    const role = channel.guild.roles.cache.find(
      (role) => role.name === "Round Alert",
    );
    await globalThis.discord_client.sendEmbed(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle("New Round Started!")
            .setDescription(" ")
            .setColor(role.hexColor),
        ],
        content: `<@&${role.id}>`,
      },
      channel,
    );
  }

  async function handleRoundEnd(data, channel) {
    const server_response = await game_server.byond_channel.request(
      {
        query: "status_authed",
        auth: game_server.settings_data.topic_token.data.setting,
      },
      {},
    );
    let fields = [];
    if (server_response) {
      const time = Math.floor(server_response.data.round_duration / 600);
      fields.push({
        name: "**Round Name**",
        value: `${server_response.data.round_name} `,
        inline: true,
      });
      fields.push({
        name: "**Round ID**",
        value: `${server_response.data.round_id} `,
        inline: true,
      });
      fields.push({
        name: "**Map**",
        value: `${server_response.data.map_name} `,
        inline: true,
      });
      if (server_response.data.next_map_name)
        fields.push({
          name: "**Next Map**",
          value: `${server_response.data.next_map_name} `,
          inline: true,
        });
      fields.push({
        name: "**Ship Map**",
        value: `${server_response.data.ship_map_name} `,
        inline: true,
      });
      if (server_response.data.next_ship_map_name)
        fields.push({
          name: "***Next Ship Map**",
          value: `${server_response.data.next_ship_map_name} `,
          inline: true,
        });
      fields.push({
        name: "**Total Players**",
        value: `${server_response.data.players} `,
        inline: true,
      });
      fields.push({
        name: "**Gamemode**",
        value: `${server_response.data.mode}`,
        inline: true,
      });
      fields.push({
        name: "**Round Time**",
        value: `${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, "0"),
        inline: true,
      });
      if (server_response.data.round_end_state)
        fields.push({
          name: "**Rouned End State**",
          value: `${server_response.data.round_end_state} `,
          inline: true,
        });
    }
    const role = channel.guild.roles.cache.find(
      (role) => role.name === "End Round Alert",
    );
    await globalThis.discord_client.sendEmbed(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle("Round Ended!")
            .setDescription(" ")
            .addFields(fields)
            .setColor(role.hexColor),
        ],
        content: `<@&${role.id}>`,
      },
      channel,
    );
  }

  async function handleShipCrash(data, channel) {
    const role = channel.guild.roles.cache.find(
      (role) => role.name === "Hijack Alert",
    );
    await globalThis.discord_client.sendEmbed(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle("Hijack!")
            .setDescription(" ")
            .setColor(role.hexColor),
        ],
        content: `<@&${role.id}>`,
      },
      channel,
    );
  }

  async function handleDistressBeacon(data, channel) {
    const role = channel.guild.roles.cache.find(
      (role) => role.name === "Distress Alert",
    );
    await globalThis.discord_client.sendEmbed(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle("Distress Beacon!")
            .setDescription(" ")
            .setColor(role.hexColor),
        ],
        content: `<@&${role.id}>`,
      },
      channel,
    );
  }

  async function handlePredator(data, channel) {
    const role = channel.guild.roles.cache.find(
      (role) => role.name === "Predator gamer",
    );
    await globalThis.discord_client.sendEmbed(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle("Predator Round!")
            .setDescription(" ")
            .setColor(role.hexColor),
        ],
        content: `<@&${role.id}>`,
      },
      channel,
    );
  }

  async function handleAhelp(data, channel) {
    const embed = {
      title: data.embed.title,
      desc: data.embed.desc,
      footer: data.embed.footer,
      content: data.embed.content,
      fields: data.embed && data.embed.fields.lenght ? data.embed.fields : null,
      url: data.embed.url,
      color: "#5a2944",
    };
    await globalThis.discord_client.embed(embed, channel);
  }

  async function handleTimeBan(data, channel) {
    const player = await fetchPlayerById(
      data.ref_player_id,
      game_server.game_connection,
    );
    let adding_ban = data.state === "add_time_ban";
    let start_time;
    if (adding_ban) {
      const now_date = new Date(player.time_ban_expiration * 1000);
      start_time = new Date(
        Date.UTC(
          now_date.getUTCFullYear(),
          now_date.getUTCMonth(),
          now_date.getUTCDate(),
          now_date.getUTCHours(),
          now_date.getUTCMinutes(),
          0,
        ),
      );
    }
    const embed = {
      title: `Time Ban ${adding_ban ? "Added" : "Removed"}`,
      desc: `Player: ${player.ckey}\nReason: ${player.time_ban_reason}${start_time ? `\nExpiration: <t:${Math.floor(start_time.getTime() / 1000)}:t>` : ""}`,
      color: adding_ban ? "#ff0000" : "#00ff00",
    };
    await globalThis.discord_client.embed(embed, channel);
  }

  async function handleJobBan(data, channel) {
    const player = await fetchPlayerById(
      data.ref_player_id,
      game_server.game_connection,
    );
    const jobBan = await fetchJobBanByPlayerId(
      data.ref_player_id,
      game_server.game_connection,
    );
    if (!jobBan) return;
    let adding_ban = data.state === "add_job_ban";
    let start_time;
    if (adding_ban) {
      const now_date = new Date(jobBan.expiration * 1000);
      start_time = new Date(
        Date.UTC(
          now_date.getUTCFullYear(),
          now_date.getUTCMonth(),
          now_date.getUTCDate(),
          now_date.getUTCHours(),
          now_date.getUTCMinutes(),
          0,
        ),
      );
    }
    const embed = {
      title: `Job Ban ${adding_ban ? "Added" : "Removed"}`,
      desc: `Player: ${player.ckey}\nRole: ${jobBan.role}\nReason: ${jobBan.text}${start_time ? `\nExpiration: <t:${Math.floor(start_time.getTime() / 1000)}:t>` : ""}`,
      color: adding_ban ? "#ff0000" : "#00ff00",
    };
    await globalThis.discord_client.embed(embed, channel);
  }

  async function handlePermaBan(data, channel) {
    const player = await fetchPlayerById(
      data.ref_player_id,
      game_server.game_connection,
    );
    let adding_ban = data.state === "add_perma_ban";
    const embed = {
      title: `Perma Ban ${adding_ban ? "Added" : "Removed"}`,
      desc: `Player: ${player.ckey}\nReason: ${player.permaban_reason}`,
      color: adding_ban ? "#ff0000" : "#00ff00",
    };
    await globalThis.discord_client.embed(embed, channel);
  }

  async function handleAutoUnban(data, channel) {
    const player = await fetchPlayerById(
      data.ref_player_id,
      game_server.game_connection,
    );
    const embed = {
      title: "Auto Unban",
      desc: `Player: ${player.ckey} has been automatically unbanned.`,
      color: "#00ff00",
    };
    await globalThis.discord_client.embed(embed, channel);
  }

  async function handleAutoUnjobban(data, channel) {
    const player = await fetchPlayerById(
      data.ref_player_id,
      game_server.game_connection,
    );
    const embed = {
      title: "Auto Unjobban",
      desc: `Player: ${player.ckey} has been automatically unjobbanned.`,
      color: "#00ff00",
    };
    await globalThis.discord_client.embed(embed, channel);
  }

  async function handleFax(data, channel) {
    const embed = {
      title: `Fax from ${data.sender_name}`,
      desc: `Department: ${data.departament}\nMessage: ${data.message}\nAdmins: ${data.admins}`,
      color: "#3498db",
    };
    await globalThis.discord_client.embed(embed, channel);
  }

  async function handleLogin(data, channel) {
    await globalThis.discord_client.sendEmbed(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle(" ")
            .setDescription(`Admin Login: ${data.key}`)
            .setColor("#2ecc71"),
        ],
      },
      channel,
    );
  }

  async function handleLogout(data, channel) {
    await globalThis.discord_client.sendEmbed(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle(" ")
            .setDescription(`Admin Logout: ${data.key}`)
            .setColor("#e74c3c"),
        ],
      },
      channel,
    );
  }

  async function fetchPlayerById(playerId, database) {
    const players = await globalThis.mysqlRequest(
      database,
      "SELECT * FROM players WHERE id = ?",
      [playerId],
    );
    return players.length ? players[0] : null;
  }

  async function fetchJobBanByPlayerId(playerId, database) {
    const jobBans = await globalThis.mysqlRequest(
      database,
      "SELECT * FROM player_job_bans WHERE player_id = ?",
      [playerId],
    );
    return jobBans.length ? jobBans[0] : null;
  }

  game_server.handle_status = async function (new_status) {
    if (game_server.settings_data.server_status.data.setting == new_status)
      return false;
    game_server.settings_data.server_status.data.setting = new_status;
    const status = await globalThis.mysqlRequest(
      globalThis.database,
      "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'",
      [game_server.id],
    );
    const channel = await globalThis.discord_client.channels.fetch(
      status[0].channel_id,
    );
    if (game_server.settings_data.server_status.data.setting) {
      if (channel) {
        if (!announced_start) announceStart(channel, game_server);
        else announced_start = false;
      }
      await game_server.byond_channel.request(
        {
          query: "set_delay",
          auth: game_server.settings_data.topic_token.data.setting,
          delay: 1,
        },
        {},
      );
      setTimeout(async () => {
        async function remove_delay(remove = true) {
          if (remove)
            game_server.byond_channel.request(
              {
                query: "set_delay",
                auth: game_server.settings_data.topic_token.data.setting,
                delay: 0,
              },
              {},
            );
          if (channel)
            globalThis.discord_client.sendEmbed(
              {
                embeds: [
                  new EmbedBuilder()
                    .setTitle(" ")
                    .setDescription(`Задержка старта снята!`)
                    .setColor("#669917"),
                ],
                content: ` `,
              },
              channel,
            );
        }
        if (
          game_server.settings_data.player_low_autoshutdown.data.setting &&
          game_server.settings_data.server_status.data.setting
        ) {
          async function check() {
            const server_response = await game_server.byond_channel.request(
              {
                query: "status_authed",
                auth: game_server.settings_data.topic_token.data.setting,
              },
              {},
            );
            if (server_response) {
              if (!server_response.data.delay) remove_delay(false);
              else if (
                server_response.data.players >
                game_server.settings_data.player_low_autoshutdown.data.setting *
                  2
              )
                remove_delay();
              else setTimeout(check, 1 * 60000);
            } else setTimeout(check, 1 * 60000);
          }
          check();
        } else remove_delay();
      }, 20 * 60000);
    } else if (channel) {
      await globalThis.discord_client.sendEmbed(
        {
          embeds: [
            new EmbedBuilder()
              .setTitle(" ")
              .setDescription(
                `Сервер выключен!\nИнформацию по следующему запуску смотрите в расписание`,
              )
              .setColor("#669917"),
          ],
          content: ` `,
        },
        channel,
      );
    }
    return true;
  };
}

async function getAdminOptions(database_connection) {
  const admins = await globalThis.mysqlRequest(
    database_connection,
    "SELECT player_id, p.ckey FROM admins a JOIN players p ON a.player_id = p.id",
  );

  return admins.map((admin) => ({
    label: admin.ckey,
    value: admin.player_id.toString(),
  }));
}

async function getRankOptions(database_connection) {
  const ranks = await globalThis.mysqlRequest(
    database_connection,
    "SELECT id, rank_name FROM admin_ranks",
  );

  return ranks.map((rank) => ({
    label: rank.rank_name,
    value: rank.id.toString(),
  }));
}

async function updateServerCustomOperators(game_server) {
  if (!game_server.settings_data.auto_start_config) {
    return;
  }

  const server_schedule_data =
    game_server.settings_data.auto_start_config.param;
  if (game_server.update_custom_operators_data["intervals"]["autostart"]) {
    clearTimeout(
      game_server.update_custom_operators_data["intervals"]["autostart"],
    );
  }

  const now_date = new Date();
  const now_utc = new Date(
    now_date.getTime() - now_date.getTimezoneOffset() * 60000,
  );
  const now_utc_string = now_utc.toISOString().split("T")[0];
  if (server_schedule_data.specific_days) {
    server_schedule_data.specific_days =
      server_schedule_data.specific_days.filter(
        (date) => date >= now_utc_string,
      );
  }
  if (server_schedule_data.mode === "daily") {
    const kill_numbers = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const start_time_utc =
      server_schedule_data.daily[kill_numbers[now_date.getUTCDay()]];
    if (start_time_utc) {
      const [hours, minutes] = start_time_utc.split(":").map(Number);
      const start_date_utc = new Date(
        now_date.getUTCFullYear(),
        now_date.getUTCMonth(),
        now_date.getUTCDate(),
        hours,
        minutes,
        0,
      );
      if (start_date_utc > now_utc) {
        const time_remaining = start_date_utc - now_utc;
        game_server.update_custom_operators_data["intervals"]["autostart"] =
          setTimeout(async () => {
            const result = await globalThis.discord_client.tgs_start(
              game_server.data.tgs_address,
              game_server.data.tgs_login,
              game_server.data.tgs_pass,
              game_server.data.tgs_id,
            );
            if (!result) return;
            const status = await globalThis.mysqlRequest(
              globalThis.database,
              "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'",
              [game_server.id],
            );
            const channel = await globalThis.discord_client.channels.fetch(
              status[0].channel_id,
            );
            if (channel) {
              announceStart(channel, game_server);
              announced_start = true;
            }
          }, time_remaining);
      }
    }
  }
  if (
    server_schedule_data.mode === "specific_days" &&
    server_schedule_data.specific_days
  ) {
    if (server_schedule_data.specific_days.includes(now_utc_string)) {
      const [hours, minutes] = server_schedule_data.time.split(":").map(Number);
      const start_date_utc = new Date(
        now_date.getUTCFullYear(),
        now_date.getUTCMonth(),
        now_date.getUTCDate(),
        hours,
        minutes,
        0,
      );
      if (start_date_utc > now_utc) {
        const time_remaining = start_date_utc - now_utc;
        game_server.update_custom_operators_data["intervals"]["autostart"] =
          setTimeout(async () => {
            const result = await globalThis.discord_client.tgs_start(
              game_server.data.tgs_address,
              game_server.data.tgs_login,
              game_server.data.tgs_pass,
              game_server.data.tgs_id,
            );
            if (!result) return;
            const status = await globalThis.mysqlRequest(
              globalThis.database,
              "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'",
              [game_server.id],
            );
            const channel = await globalThis.discord_client.channels.fetch(
              status[0].channel_id,
            );
            if (channel) {
              announceStart(channel, game_server);
              announced_start = true;
            }
          }, time_remaining);
      }
    }
  }
}

async function announceStart(channel, game_server) {
  const role = channel.guild.roles.cache.find(
    (role) => role.name === "Start Alert",
  );
  const now_date = new Date();
  const start_time = new Date(
    Date.UTC(
      now_date.getUTCFullYear(),
      now_date.getUTCMonth(),
      now_date.getUTCDate(),
      now_date.getUTCHours(),
      now_date.getUTCMinutes(),
      0,
    ),
  );
  await globalThis.discord_client.sendEmbed(
    {
      embeds: [
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(
            `Запуск!\nРаунд начнётся не раньше чем в <t:${Math.floor(start_time.getTime() / 1000 + 20 * 60)}:t>${
              game_server.settings_data.player_low_autoshutdown.data.setting
                ? ` и когда количество игроков на сервере будет больше ${game_server.settings_data.player_low_autoshutdown.data.setting} автоматически`
                : ""
            }`,
          )
          .setColor("#669917"),
      ],
      content: `<@&${role.id}>`,
    },
    channel,
  );
}

/// MANAGING PLAYERS

async function checkPT(
  interaction,
  game_server,
  ckey,
  player_data,
  selected_player_id,
) {
  const db_player_playtime = await globalThis.mysqlRequest(
    game_server.game_connection,
    "SELECT role_id, total_minutes FROM player_playtime WHERE player_id = ? ORDER BY total_minutes DESC",
    [selected_player_id],
  );

  ///EMBED CONSTRUCTOR
  const embeds = [];
  let description = "";
  let embed_description = "";
  let fields = [];

  const checkEmbedPart = () => {
    if (description.length > 824) {
      fields.push({ name: " ", value: description });
      description = "";
    } else if (description.length > 3896) {
      embed_description = description;
      description = "";
    }
    if (fields.length == 25) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(embed_description)
          .addFields(fields)
          .setColor("#669917"),
      );
      embed_description = "";
      fields = [];
    }
  };

  const addEmbedPart = () => {
    if (description.length) {
      if (embed_description.length) {
        fields.push({ name: " ", value: description });
        description = "";
      } else {
        embed_description = description;
        description = "";
      }
    }

    if (fields.length || embed_description.length) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(embed_description || " ")
          .addFields(fields.length ? fields : [{ name: " ", value: " " }])
          .setColor("#669917"),
      );
      fields = [];
      embed_description = "";
    }
  };
  ///

  for (const playtime of db_player_playtime) {
    description += `**${playtime.role_id}** - ${(playtime.total_minutes / 60).toFixed(2)}h\n`;
    checkEmbedPart();
  }
  addEmbedPart();

  await globalThis.discord_client.sendEmbed(
    {
      embeds: embeds,
      content: `${ckey} Play Times`,
      components: [],
      type: "ephemeraledit",
    },
    interaction,
  );
}

async function checkNotes(
  interaction,
  game_server,
  ckey,
  player_data,
  selected_player_id,
) {
  const db_player_notes = await globalThis.mysqlRequest(
    game_server.game_connection,
    "SELECT admin_id, text, date, is_ban, ban_time, is_confidential, players.ckey AS admin_ckey FROM player_notes JOIN players ON player_notes.admin_id = players.id WHERE player_id = ?",
    [selected_player_id],
  );

  ///EMBED CONSTRUCTOR
  const embeds = [];
  let description = "";
  let embed_description = "";
  let fields = [];

  const checkEmbedPart = () => {
    if (description.length > 824) {
      fields.push({ name: " ", value: description });
      description = "";
    } else if (description.length > 3896) {
      embed_description = description;
      description = "";
    }
    if (fields.length == 25) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(embed_description)
          .addFields(fields)
          .setColor("#669917"),
      );
      embed_description = "";
      fields = [];
    }
  };

  const addEmbedPart = () => {
    if (description.length) {
      if (embed_description.length) {
        fields.push({ name: " ", value: description });
        description = "";
      } else {
        embed_description = description;
        description = "";
      }
    }

    if (fields.length || embed_description.length) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(embed_description || " ")
          .addFields(fields.length ? fields : [{ name: " ", value: " " }])
          .setColor("#669917"),
      );
      fields = [];
      embed_description = "";
    }
  };
  ///

  for (const notes of db_player_notes) {
    description += `**Reason:** ${notes.text}\n`;
    if (notes.is_ban) {
      description += `**Ban**${notes.ban_time ? ` for ${(notes.ban_time / 60).toFixed(2)}h` : ""}\n`;
    }
    if (notes.is_confidential) {
      description += "## **Confidential**\n";
    }
    description += `-# **Admin:** ${notes.admin_ckey}\n-# **Date:** ${notes.date}\n\n`;
    checkEmbedPart();
  }
  addEmbedPart();

  await globalThis.discord_client.sendEmbed(
    {
      embeds: embeds,
      content: `**${ckey}** Notes`,
      components: [],
      type: "ephemeraledit",
    },
    interaction,
  );
}

async function checkBP(
  interaction,
  game_server,
  ckey,
  player_data,
  selected_player_id,
) {
  const db_player_bp = await globalThis.mysqlRequest(
    game_server.game_connection,
    "SELECT season, xp, rewards, premium_rewards, premium FROM battlepass_players WHERE player_id = ?",
    [selected_player_id],
  );

  ///EMBED CONSTRUCTOR
  const embeds = [];
  let description = "";
  let embed_description = "";
  let fields = [];

  const checkEmbedPart = () => {
    if (description.length > 824) {
      fields.push({ name: " ", value: description });
      description = "";
    } else if (description.length > 3896) {
      embed_description = description;
      description = "";
    }
    if (fields.length == 25) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(embed_description)
          .addFields(fields)
          .setColor("#669917"),
      );
      embed_description = "";
      fields = [];
    }
  };

  const addEmbedPart = () => {
    if (description.length) {
      if (embed_description.length) {
        fields.push({ name: " ", value: description });
        description = "";
      } else {
        embed_description = description;
        description = "";
      }
    }

    if (fields.length || embed_description.length) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(embed_description || " ")
          .addFields(fields.length ? fields : [{ name: " ", value: " " }])
          .setColor("#669917"),
      );
      fields = [];
      embed_description = "";
    }
  };
  ///

  for (const battlepass of db_player_bp) {
    description += `**Season:** ${battlepass.season}\n**XP:** ${battlepass.xp}\n${battlepass.premium ? "**PREMIUM ACTIVE**\n" : ""}\n`;
    // Потом сюда rewards и premium_rewards список выводился да бы
    checkEmbedPart();
  }
  addEmbedPart();

  const db_player_coins = await globalThis.mysqlRequest(
    game_server.game_connection,
    "SELECT coins_ammount FROM players_shop WHERE player_id = ?",
    [selected_player_id],
  );

  await globalThis.discord_client.sendEmbed(
    {
      embeds: embeds,
      content: `**${ckey}** BP\n Coins: ${db_player_coins[0] ? db_player_coins[0].coins_ammount : 0}`,
      components: [],
      type: "ephemeraledit",
    },
    interaction,
  );
}

/// MANAGING BATTLEPASS

async function checkBPRewards(interaction, game_server) {
  return interaction && game_server;
}

async function checkBPSeason(interaction, game_server) {
  return interaction && game_server;
}

async function addBPReward(interaction, game_server) {
  return interaction && game_server;
}

async function removeBPReward(interaction, game_server) {
  return interaction && game_server;
}

async function addBPSeason(interaction, game_server) {
  return interaction && game_server;
}

async function editBPSeason(interaction, game_server) {
  return interaction && game_server;
}

/// MANAGING ADMINS

async function manageAddAdmin(interaction, game_server) {
  const result = await findPlayerByCkey(interaction, game_server);
  if (!Array.isArray(result)) return;

  const [, player_data, selected_player_id] = result;

  const admins = await globalThis.mysqlRequest(
    game_server.game_connection,
    "SELECT player_id FROM admins",
  );
  if (admins.find((admin) => admin.player_id == selected_player_id))
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "This admin already exist", color: "#c70058" },
      interaction,
    );

  const all_ranks = await getRankOptions(game_server.game_connection);
  const selected_rank_id =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Rank",
      all_ranks,
      "Select the rank to assign:",
    );
  if (!selected_rank_id)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected rank", color: "#c70058" },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} admin: [${player_data.ckey}], rank: [${all_ranks.find((rank) => rank.value == selected_rank_id).label}]`,
    game_server,
  );

  await globalThis.mysqlRequest(
    game_server.game_connection,
    "INSERT INTO admins (player_id, rank_id) VALUES (?, ?)",
    [selected_player_id, Number.parseInt(selected_rank_id)],
  );
  const selected_action =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Set Titles",
      [
        { label: "Set Up", value: "set" },
        { label: "Skip", value: "skip" },
      ],
      "Would you like to assign extra titles to this admin?",
    );
  if (selected_action === "set") {
    const selected_extra_ranks =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Extra Titles",
        all_ranks,
        "Select extra titles to assign:",
        true,
      );
    if (selected_extra_ranks && selected_extra_ranks.length) {
      globalThis.createLog(
        `${interaction.user.id} admin: [${player_data.ckey}], extra titles: [${JSON.stringify(selected_extra_ranks)}]`,
        game_server,
      );

      await globalThis.mysqlRequest(
        game_server.game_connection,
        "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?",
        [JSON.stringify(selected_extra_ranks), selected_player_id],
      );
    }
  }
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Admin added successfully!", color: "#669917" },
    interaction,
  );
}

async function manageRemoveAdmin(interaction, game_server) {
  const all_admins = await getAdminOptions(game_server.game_connection);
  if (!all_admins.length)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Not found admins to remove",
        color: "#c70058",
      },
      interaction,
    );

  const selected_admin_id =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Admin",
      all_admins,
      "Select the admin to remove:",
    );
  if (!selected_admin_id)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected admin", color: "#c70058" },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} admin: [${all_admins.find((admin) => admin.value == selected_admin_id).label}]`,
    game_server,
  );

  await globalThis.mysqlRequest(
    game_server.game_connection,
    "DELETE FROM admins WHERE player_id = ?",
    [Number.parseInt(selected_admin_id)],
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Admin removed successfully!", color: "#669917" },
    interaction,
  );
}

async function manageUpdateAdmin(interaction, game_server) {
  const all_admins = await getAdminOptions(game_server.game_connection);
  if (!all_admins.length)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Not found admins to update",
        color: "#c70058",
      },
      interaction,
    );

  let selected_admin_id =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Admin",
      all_admins,
      "Select the admin to update:",
    );
  if (!selected_admin_id)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected admin", color: "#c70058" },
      interaction,
    );

  selected_admin_id = Number.parseInt(selected_admin_id);

  const selected_action =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Update Rank",
      [
        { label: "Update", value: "update" },
        { label: "Skip", value: "skip" },
      ],
      "Would you like to update rank to this admin?",
    );
  if (selected_action === "update") {
    const all_ranks = await getRankOptions(game_server.game_connection);
    const selected_rank_id =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Rank",
        all_ranks,
        "Select the new rank to assign:",
      );
    if (selected_rank_id) {
      globalThis.createLog(
        `${interaction.user.id} admin: [${all_admins.find((admin) => admin.value == selected_admin_id).label}], rank: [${all_ranks.find((rank) => rank.value == selected_rank_id).label}]`,
        game_server,
      );

      await globalThis.mysqlRequest(
        game_server.game_connection,
        "UPDATE admins SET rank_id = ? WHERE player_id = ?",
        [Number.parseInt(selected_rank_id), selected_admin_id],
      );
    }
  }
  const selected_action_titles =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Update Titles",
      [
        { label: "Update", value: "update" },
        { label: "Remove", value: "remove" },
        { label: "Skip", value: "skip" },
      ],
      "Would you like to update extra titles to this admin?",
    );
  switch (selected_action_titles) {
    case "update":
      {
        const request = await globalThis.mysqlRequest(
          game_server.game_connection,
          "SELECT extra_titles_encoded FROM admins WHERE player_id = ?",
          [selected_admin_id],
        );
        const selected_player = request[0];
        let extra_titles = selected_player.extra_titles_encoded
          ? JSON.parse(selected_player.extra_titles_encoded)
          : [];
        const extra_rank_options = await getRankOptions(
          game_server.game_connection,
        );
        const selected_extra_ranks =
          await globalThis.discord_client.sendInteractionSelectMenu(
            interaction,
            "Select Extra Titles",
            extra_rank_options.filter(
              (option) => !extra_titles.includes(option.value),
            ),
            "Select extra titles to assign:",
            true,
          );
        if (selected_extra_ranks && selected_extra_ranks.length) {
          extra_titles = [
            ...new Set([...extra_titles, ...selected_extra_ranks]),
          ];

          globalThis.createLog(
            `${interaction.user.id} admin: [${all_admins.find((admin) => admin.value == selected_admin_id).label}], extra titles: (${selected_player.extra_titles_encoded}) > [${JSON.stringify(extra_titles)}]`,
            game_server,
          );

          await globalThis.mysqlRequest(
            game_server.game_connection,
            "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?",
            [JSON.stringify(extra_titles), selected_admin_id],
          );
        }
      }
      break;

    case "remove":
      {
        const request = await globalThis.mysqlRequest(
          game_server.game_connection,
          "SELECT extra_titles_encoded FROM admins WHERE player_id = ?",
          [selected_admin_id],
        );
        const selected_player = request[0];
        if (selected_player.extra_titles_encoded) {
          let extra_titles = JSON.parse(selected_player.extra_titles_encoded);
          const extra_rank_options = await getRankOptions(
            game_server.game_connection,
          );
          const assignedOptions = extra_rank_options.filter((option) =>
            extra_titles.includes(option.value),
          );
          const selected_extra_ranks =
            await globalThis.discord_client.sendInteractionSelectMenu(
              interaction,
              "Select Extra Titles",
              assignedOptions,
              "Select extra titles to remove:",
              true,
            );
          if (selected_extra_ranks && selected_extra_ranks.length) {
            extra_titles = extra_titles.filter(
              (title) => !selected_extra_ranks.includes(title),
            );

            globalThis.createLog(
              `${interaction.user.id} admin: [${all_admins.find((admin) => admin.value == selected_admin_id).label}], extra titles: (${selected_player.extra_titles_encoded}) > [${JSON.stringify(extra_titles)}]`,
              game_server,
            );

            await globalThis.mysqlRequest(
              game_server.game_connection,
              "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?",
              [JSON.stringify(extra_titles), selected_admin_id],
            );
          }
        }
      }
      break;
  }
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Admin updated successfully!", color: "#669917" },
    interaction,
  );
}

/// MANAGING RANKS

async function manageAddRank(interaction, game_server) {
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: "Enter the name of the new rank",
      color: "#669917",
    },
    interaction,
  );
  const rank_name =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!rank_name)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not given name", color: "#c70058" },
      interaction,
    );

  const all_ranks = await globalThis.mysqlRequest(
    game_server.game_connection,
    "SELECT rank_name FROM admin_ranks",
  );
  if (all_ranks.find((rank) => rank.rank_name == rank_name))
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "This rank already exist", color: "#c70058" },
      interaction,
    );

  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: "Enter the text rights for this rank",
      color: "#669917",
    },
    interaction,
  );
  const text_rights =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!text_rights)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not given rights", color: "#c70058" },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} rank: [${rank_name}], rights: [${text_rights}]`,
    game_server,
  );

  await globalThis.mysqlRequest(
    game_server.game_connection,
    "INSERT INTO admin_ranks (rank_name, text_rights) VALUES (?, ?)",
    [rank_name, text_rights],
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Rank ${rank_name} added successfully!`,
      color: "#669917",
    },
    interaction,
  );
}

async function manageRemoveRank(interaction, game_server) {
  const all_ranks = await getRankOptions(game_server.game_connection);
  if (!all_ranks.length)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not found ranks to remove", color: "#c70058" },
      interaction,
    );

  const selected_rank_id =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Rank",
      all_ranks,
      "Select the rank to remove:",
    );
  if (!selected_rank_id)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected rank", color: "#c70058" },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} rank: [${all_ranks.find((rank) => rank.value == selected_rank_id).label}]`,
    game_server,
  );

  await globalThis.mysqlRequest(
    game_server.game_connection,
    "DELETE FROM admin_ranks WHERE id = ?",
    [Number.parseInt(selected_rank_id)],
  );
  const adminst_extra_titled = await globalThis.mysqlRequest(
    game_server.game_connection,
    "SELECT player_id, extra_titles_encoded FROM admins WHERE extra_titles_encoded LIKE ?",
    [`%${selected_rank_id}%`],
  );
  for (const admin of adminst_extra_titled) {
    let extra_titles = JSON.parse(admin.extra_titles_encoded);
    extra_titles = extra_titles.filter((id) => id != selected_rank_id);
    await globalThis.mysqlRequest(
      game_server.game_connection,
      "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?",
      [
        extra_titles.length ? JSON.stringify(extra_titles) : null,
        admin.player_id,
      ],
    );
  }
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Rank removed successfully!", color: "#669917" },
    interaction,
  );
}

async function manageUpdateRank(interaction, game_server) {
  const all_ranks = await getRankOptions(game_server.game_connection);
  if (!all_ranks.length)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not found ranks to update", color: "#c70058" },
      interaction,
    );

  const selected_rank_id =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Rank",
      all_ranks,
      "Select the rank to update:",
    );
  if (!selected_rank_id)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected rank", color: "#c70058" },
      interaction,
    );

  const selected_action =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Update Rank",
      [
        { label: "Update", value: "update" },
        { label: "Skip", value: "skip" },
      ],
      "Would you like to update rank name?",
    );
  if (selected_action === "update") {
    await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Enter the new name for the rank",
        color: "#669917",
      },
      interaction,
    );
    const new_name =
      await globalThis.discord_client.collectUserInput(interaction);
    if (!new_name)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Request", desc: "Not given name", color: "#c70058" },
        interaction,
      );

    globalThis.createLog(
      `${interaction.user.id} rank: (${all_ranks.find((rank) => rank.value == selected_rank_id).label}) > [${new_name}]`,
      game_server,
    );

    await globalThis.mysqlRequest(
      game_server.game_connection,
      "UPDATE admin_ranks SET rank_name = ? WHERE id = ?",
      [new_name, Number.parseInt(selected_rank_id)],
    );
  }
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: "Enter the text rights for this rank",
      color: "#669917",
    },
    interaction,
  );
  const new_rights =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!new_rights)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not give rights", color: "#c70058" },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} rank: (${all_ranks.find((rank) => rank.value == selected_rank_id).label}) > [${new_rights}]`,
    game_server,
  );

  await globalThis.mysqlRequest(
    game_server.game_connection,
    "UPDATE admin_ranks SET text_rights = ? WHERE id = ?",
    [new_rights, Number.parseInt(selected_rank_id)],
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Rank updated successfully!", color: "#669917" },
    interaction,
  );
}

/// MANAGING WHITELISTS

async function manageAddWhitelist(interaction, game_server, acting_wls) {
  const result = await findPlayerByCkey(interaction, game_server);
  if (!Array.isArray(result)) return;

  const [, player_data, selected_player_id] = result;

  const player = player_data.find((p) => p.id == selected_player_id);
  let current_whitelists = player.whitelist_status
    ? player.whitelist_status.split("|")
    : [];
  const availableRoles = Object.entries(acting_wls)
    .filter(([key]) => !current_whitelists.includes(key))
    .map(([key, value]) => ({
      label: value,
      value: key,
    }));
  if (!availableRoles.length)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "No whitelists available to add. The player already has all possible whitelists",
        color: "#c70058",
      },
      interaction,
    );

  const selected_whitelists =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Roles",
      availableRoles,
      "Select the whitelists to add:",
      true,
    );
  if (!selected_whitelists)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected whitelists", color: "#c70058" },
      interaction,
    );

  current_whitelists = [
    ...new Set([...current_whitelists, ...selected_whitelists]),
  ];

  globalThis.createLog(
    `${interaction.user.id} ckey: [${player.ckey}], whitelist: (${player.whitelist_status ? player.whitelist_status.split("|") : []}) > [${current_whitelists.join("|")}]`,
    game_server,
  );

  await globalThis.mysqlRequest(
    game_server.game_connection,
    "UPDATE players SET whitelist_status = ? WHERE id = ?",
    [current_whitelists.join("|"), selected_player_id],
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Roles added successfully!", color: "#669917" },
    interaction,
  );
}

async function manageRemoveWhitelist(interaction, game_server, acting_wls) {
  const result = await findPlayerByCkey(interaction, game_server);
  if (!Array.isArray(result)) return;

  const [, player_data, selected_player_id] = result;

  const player = player_data.find(
    (p) => p.id.toString() === selected_player_id,
  );
  if (!player.whitelist_status)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "This player has no whitelists to remove",
        color: "#c70058",
      },
      interaction,
    );

  let current_whitelists = player.whitelist_status.split("|");
  const roleOptions = current_whitelists.map((role) => ({
    label: acting_wls[role] || role,
    value: role,
  }));
  const selected_whitelists =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Roles",
      roleOptions,
      "Select the whitelists to remove:",
      true,
    );
  if (!selected_whitelists)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected whitelists", color: "#c70058" },
      interaction,
    );

  selected_whitelists.forEach((selectedRole) => {
    const index = current_whitelists.indexOf(selectedRole);
    if (index > -1) {
      current_whitelists.splice(index, 1);
    }
  });

  globalThis.createLog(
    `${interaction.user.id} ckey: [${player.ckey}], whitelist: (${player.whitelist_status.split("|")}) > [${current_whitelists.join("|")}]`,
    game_server,
  );

  await globalThis.mysqlRequest(
    game_server.game_connection,
    "UPDATE players SET whitelist_status = ? WHERE id = ?",
    [current_whitelists.join("|"), selected_player_id],
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Roles removed successfully!", color: "#669917" },
    interaction,
  );
}

/// MANAGE AUTOSTART

async function viewSchedule(interaction, game_server, server_schedule_data) {
  const schedule = await getSchedule(server_schedule_data);
  if (schedule) {
    await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: schedule, color: "#669917" },
      interaction,
    );
  } else {
    await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "An error occurred while retrieving the schedule.",
        color: "#c70058",
      },
      interaction,
    );
  }
}

async function setMode(interaction, game_server, server_schedule_data) {
  const selected_mode =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Mode",
      [
        { label: "Daily", value: "daily" },
        { label: "Specific Days", value: "weekly" },
        { label: "OFF", value: "off" },
      ],
      "Choose a mode for server auto-start:",
    );
  server_schedule_data.mode = selected_mode;
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Mode set to ${selected_mode} for server ${game_server.data.server_name}`,
      color: "#669917",
    },
    interaction,
  );
}

async function setDailyTimes(interaction, game_server, server_schedule_data) {
  const selected_day =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Day",
      [
        { label: "Monday", value: "monday" },
        { label: "Tuesday", value: "tuesday" },
        { label: "Wednesday", value: "wednesday" },
        { label: "Thursday", value: "thursday" },
        { label: "Friday", value: "friday" },
        { label: "Saturday", value: "saturday" },
        { label: "Sunday", value: "sunday" },
      ],
      "Choose a day for setting up auto-start time:",
    );
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: "Please enter the time for auto-start in hh:mm (UTC+0) format",
      color: "#669917",
    },
    interaction,
  );
  const time_input =
    await globalThis.discord_client.collectUserInput(interaction);
  const time_regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!time_regex.test(time_input))
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Invalid time format. Please use hh:mm format",
        color: "#c70058",
      },
      interaction,
    );

  server_schedule_data.daily = server_schedule_data.daily || {};
  server_schedule_data.daily[selected_day] = time_input;
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Time set to ${time_input} for ${selected_day} on server ${game_server.data.server_name}`,
      color: "#669917",
    },
    interaction,
  );
}

async function removeDailyTimes(
  interaction,
  game_server,
  server_schedule_data,
) {
  if (
    !server_schedule_data.daily ||
    !Object.keys(server_schedule_data.daily).length
  )
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: `No daily start times are set for server ${game_server.data.server_name}`,
        color: "#c70058",
      },
      interaction,
    );

  const dayOptions = Object.keys(server_schedule_data.daily).map((day) => ({
    label: day,
    value: day,
  }));
  if (!dayOptions.length)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: `No days are available for removal from daily start schedule for server ${game_server.data.server_name}`,
        color: "#c70058",
      },
      interaction,
    );

  const selected_day =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Day",
      dayOptions,
      "Choose a day to remove:",
    );
  delete server_schedule_data.daily[selected_day];
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Removed daily start time for ${selected_day} on server ${game_server.data.server_name}`,
      color: "#669917",
    },
    interaction,
  );
}

async function setSpecificDays(interaction, game_server, server_schedule_data) {
  let moreDays = true;
  const specificTimes = {};
  while (moreDays) {
    await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: 'Please enter a date for specific start in YYYY-MM-DD format (1984-01-01) or type "done" to finish',
        color: "#669917",
      },
      interaction,
    );
    const date_input =
      await globalThis.discord_client.collectUserInput(interaction);
    if (date_input.toLowerCase() === "done") {
      moreDays = false;
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date_input))
        return await globalThis.discord_client.ephemeralEmbedEdit(
          {
            title: "Request",
            desc: "Invalid date format. Please use YYYY-MM-DD format",
            color: "#c70058",
          },
          interaction,
        );

      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "Please enter the time for auto-start in hh:mm (UTC+0) format",
          color: "#669917",
        },
        interaction,
      );
      const time_input =
        await globalThis.discord_client.collectUserInput(interaction);
      const time_regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!time_regex.test(time_input))
        return await globalThis.discord_client.ephemeralEmbedEdit(
          {
            title: "Request",
            desc: "Invalid time format. Please use hh:mm format",
            color: "#c70058",
          },
          interaction,
        );

      specificTimes[date_input] = time_input;
    }
  }
  server_schedule_data.spec = server_schedule_data.spec || {};
  Object.keys(specificTimes).forEach((date) => {
    server_schedule_data.spec[date] = specificTimes[date];
  });
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Specific start days set for server ${game_server.data.server_name}`,
      color: "#669917",
    },
    interaction,
  );
}

async function removeSpecificDays(
  interaction,
  game_server,
  server_schedule_data,
) {
  const now = new Date().toISOString().split("T")[0];
  if (
    !server_schedule_data.spec ||
    !Object.keys(server_schedule_data.spec).length
  )
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: `No specific dates are set for server ${game_server.data.server_name}`,
        color: "#c70058",
      },
      interaction,
    );

  const specificDayOptions = Object.keys(server_schedule_data.spec)
    .filter((date) => date >= now)
    .map((date) => ({ label: date, value: date }));
  if (!specificDayOptions.length)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: `All specific dates have passed for server ${game_server.data.server_name}`,
        color: "#c70058",
      },
      interaction,
    );

  const selectedDates =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Date",
      specificDayOptions,
      "Choose a specific date to remove:",
      true,
    );
  selectedDates.forEach((selectedDate) => {
    delete server_schedule_data.spec[selectedDate];
  });
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Removed specific start dates for server ${game_server.data.server_name}`,
      color: "#669917",
    },
    interaction,
  );
}

/// FIND PLAYER BY CKEY

async function findPlayerByCkey(interaction, game_server) {
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: "Enter the ckey (or what it most likely) of the player",
      color: "#669917",
    },
    interaction,
  );
  const ckey = await globalThis.discord_client.collectUserInput(interaction);
  if (!ckey)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not given ckey", color: "#c70058" },
      interaction,
    );

  const player_data = await globalThis.mysqlRequest(
    game_server.game_connection,
    "SELECT id, ckey, whitelist_status FROM players WHERE ckey LIKE ?",
    [`%${ckey}%`],
  );
  if (!player_data.length)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Not found player with that ckey",
        color: "#c70058",
      },
      interaction,
    );

  const player_options = player_data.map((player) => ({
    label: player.ckey,
    value: player.id.toString(),
  }));
  const selected_player_id =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select Player",
      player_options,
      "Select the player:",
    );
  if (!selected_player_id)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected player", color: "#c70058" },
      interaction,
    );

  return [ckey, player_data, Number.parseInt(selected_player_id)];
}

/// MINOR FUNCTIONAL

async function getSchedule(server_schedule_data) {
  try {
    const now = new Date();
    let schedule = " ";
    if (server_schedule_data.daily) {
      schedule += "**Daily Schedule:**\n";
      for (const [day, time] of Object.entries(server_schedule_data.daily)) {
        const [hours, minutes] = time.split(":").map(Number);
        const start_time = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            hours,
            minutes,
            0,
          ),
        );
        schedule += `- ${day}: <t:${Math.floor(start_time.getTime() / 1000)}:t>\n`;
      }
    }
    if (server_schedule_data.spec) {
      schedule += "\n**Specific Dates:**\n";
      for (const [date, time] of Object.entries(server_schedule_data.spec)) {
        const [hours, minutes] = time.split(":").map(Number);
        const [year, month, day] = date.split("-").map(Number);
        const start_time = new Date(
          Date.UTC(year, month, day, hours, minutes, 0),
        );
        schedule += `- ${date}: <t:${Math.floor(start_time.getTime() / 1000)}:t>\n`;
      }
    }
    if (!server_schedule_data.daily && !server_schedule_data.spec) {
      schedule += "No scheduled times available.";
    }
    return schedule;
  } catch (error) {
    console.log("CM >> SCHEDULE >> [ERROR] >>", error);
    return error;
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
