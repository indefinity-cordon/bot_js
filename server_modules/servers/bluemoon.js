import { EmbedBuilder } from "discord.js";
// legacy shit
export default async function declareBluemoon(game_server) {
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
          name: "**ID Раунда**",
          value: `${server_response.data.round_id} `,
          inline: true,
        },
        {
          name: "**Карта**",
          value: `${server_response.data.map_name} `,
          inline: true,
        },
        {
          name: "**Вход**",
          value: `${server_response.data.enter ? "Разрешен" : "Запрещен"}`,
          inline: true,
        },
        {
          name: "**Игроков**",
          value: `${server_response.data.players} `,
          inline: true,
        },
        {
          name: "**Режим**",
          value: `${server_response.data.mode}`,
          inline: true,
        },
        {
          name: "**Время раунда**",
          value: `${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, "0"),
          inline: true,
        },
      ];
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
            content: `${game_server.data.server_name} Статус`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    } catch (error) {
      if (error && error != "Returned no response")
        globalThis._LogsHandler.sendSimplyLog(
          "Auto Events",
          null,
          globalThis.logWithID(),
          [{ name: "Warning", value: error }],
        );
      if (failed_times > 12) {
        failed_times = 0;
      } else failed_times++;
      for (const message of game_server.updater_messages[type]) {
        await globalThis.discord_client.sendEmbed(
          {
            embeds: [
              new EmbedBuilder()
                .setTitle(" ")
                .setDescription("# ВЫКЛЮЧЕН")
                .setColor("#a00f0f")
                .setTimestamp(),
            ],
            content: `${game_server.data.server_name} Статус`,
            components: [],
            type: "edit",
          },
          message,
        );
      }
    }
  };

  game_server.handling_updaters = {
    message_status: game_server.updateStatusMessage,
  };

  game_server.SendByondMessages = async function (data) {
    const server_response = await game_server.byond_channel.request(
      {
        query: "send_info",
        auth: game_server.settings_data.topic_token.data.setting,
        data: data,
      },
      { retries: 1, timeout: 5 * 1000 },
    );
    return server_response?.statuscode == 200;
  };

  ////////////////////////////////////////////////////////////////////////////////
  /////////////////////////// END OF HANDLING UPDATERS ///////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  game_server.do_verification = async function (interaction, user_identifier) {
    if (await game_server.check_verification(interaction, true))
      return await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Verification", desc: "You already verified" },
        interaction,
      );

    let server_response = await game_server.byond_channel.request(
      {
        query: "certify",
        auth: game_server.settings_data.topic_token.data.setting,
        identifier: `${user_identifier}`,
        discord_id: interaction.user.id,
      },
      {},
    );
    if (!server_response)
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: "Try later\nStatuscode: 404\nReport to devs if persist",
          color: "#c70058",
        },
        interaction,
      );

    if (server_response.statuscode == 200) {
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: "You successfully verified",
          color: "#c70058",
        },
        interaction,
      );
      await game_server.check_verification(interaction, true);
    } else {
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Verification",
          desc: `Statuscode: ${server_response.statuscode}\nResponse: ${server_response.response}`,
          color: "#c70058",
        },
        interaction,
      );
    }
  };

  game_server.check_verification = async function (interaction, silent) {
    const server_response = await game_server.byond_channel.request(
      {
        query: "lookup_discord_id",
        auth: game_server.settings_data.topic_token.data.setting,
        discord_id: interaction.user.id,
      },
      {},
    );
    if (!server_response) {
      if (!silent)
        await globalThis.discord_client.ephemeralEmbedEdit(
          {
            title: "Verification",
            desc: "Try later\nStatuscode: 404\nReport to devs if persist",
            color: "#c70058",
          },
          interaction,
        );
      return 0;
    }

    if (
      server_response.statuscode == 200 &&
      globalThis.guilds_link[`${interaction.guildId}`]
    ) {
      const guild = globalThis.guilds_link[`${interaction.guildId}`];
      if (
        guild.settings_data.verified_role &&
        guild.settings_data.anti_verified_role
      ) {
        const interactionUser = await interaction.guild.members.fetch(
          interaction.user.id,
        );
        interactionUser.roles.add(
          guild.settings_data.verified_role.data.setting,
        );
        interactionUser.roles.remove(
          guild.settings_data.anti_verified_role.data.setting,
        );
      }

      if (!silent)
        await globalThis.discord_client.ephemeralEmbedEdit(
          {
            title: "Verification",
            desc: "You already verified",
            color: "#c70058",
          },
          interaction,
        );
      return 1;
    }

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
  };

  //TODO: Я не помню что я тут кодил, но если приспичит, надо вынесте в кастомный функционал... и модульно... но мне лень.
  game_server.infoRequest = async function (interaction) {
    const target_user = interaction.options.getUser("user");
    const self_request = interaction.user.id == target_user.id;
    const server_response = await game_server.byond_channel.request(
      {
        query: "lookup_discord_id",
        auth: game_server.settings_data.topic_token.data.setting,
        discord_id: target_user.id,
        additional: true,
      },
      {},
    );
    if (!server_response)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "Try later\nStatuscode: 404\nReport to devs if persist",
          color: "#c70058",
        },
        interaction,
      );

    if (server_response.statuscode != 200)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: `Statuscode: ${server_response.statuscode}\nResponse: ${server_response.response}`,
          color: "#c70058",
        },
        interaction,
      );

    const data = server_response.data;

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

    let total_pt = 0;
    if (data.playtimes) {
      for (const [pt_name, pt_min] of Object.entries(data.playtimes)) {
        description += `**${pt_name}** - ${(pt_min / 60).toFixed(2)}ч\n`;
        total_pt += pt_min;
        checkEmbedPart();
      }
      addEmbedPart();
    }

    if (Array.isArray(data.bans) && data.bans.length) {
      for (const {
        bantime,
        bantype,
        reason,
        job,
        duration,
        expiration,
        round_id,
      } of data.bans) {
        description += `#**${bantype}** (${bantime} | ${expiration ? `${expiration}` : "пермаментный"})\n`;
        if (duration)
          description += `**Время** - ${(duration / 60).toFixed(2)}ч\n`;
        description += `**Причина** - ${reason}\n`;
        if (job) description += `**Роль** - ${job}\n`;
        description += `**Раунд:** ${round_id}\n\n`;
        checkEmbedPart();
      }
      addEmbedPart();
    }

    if (self_request && Array.isArray(data.notes) && data.notes.length) {
      for (const { admin_key, text, timestamp } of data.notes) {
        description += `**Админ** - ${admin_key}\n**Причина** - ${text}\n**Выдан:** ${timestamp}\n\n`;
        checkEmbedPart();
      }
      addEmbedPart();
    }

    await globalThis.discord_client.sendEmbed(
      {
        embeds: embeds,
        content: `${data.ckey} Info${total_pt ? `\n**Total PT** - ${(total_pt / 60).toFixed(2)}ч` : ""}`,
        components: [],
        type: "ephemeraledit",
      },
      interaction,
    );
  };

  game_server.manageAuth = async function (interaction) {
    const selected_action =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Action",
        [
          { label: "Certify Player (Ckey, Discord ID)", value: "certify" },
          {
            label: "Remove Certify From Player (Ckey)",
            value: "decertify_ckey",
          },
          {
            label: "Remove Certify From Player (Discord ID)",
            value: "decertify_id",
          },
        ],
        "Choose an action for player management:",
      );
    if (!selected_action) return;

    const handling_options = {
      certify: manageCertify,
      decertify_ckey: manageDecertifyCkey,
      decertify_id: manageDecertifyId,
    };
    await handling_options[selected_action](interaction, game_server);
  };

  game_server.manageAdmin = async function (interaction) {
    const selected_action =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select Action",
        [{ label: "Ban Player (Ckey)", value: "ban_ckey" }],
        "Choose an action for player management:",
      );
    if (!selected_action) return;

    const handling_options = {
      ban_ckey: manageBanCkey,
    };
    await handling_options[selected_action](interaction, game_server);
  };

  game_server.handling_actions = {
    manage_auth: game_server.manageAuth,
    manage_admin: game_server.manageAdmin,
  };

  game_server.handling_commands = [
    { label: "Manage Auth", value: "manage_auth" },
    { label: "Manage Player", value: "manage_admin" },
  ];

  game_server.serverCustomOperators = async function () {
    await updateServerCustomOperators(game_server);
    game_server.update_custom_operatos_interval = setInterval(
      updateServerCustomOperators,
      60 * 60000,
      game_server,
    );
  };
}

/// MANAGE AUTH

async function manageCertify(interaction, game_server) {
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Enter player ckey", color: "#669917" },
    interaction,
  );
  const player_ckey =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!player_ckey)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not given ckey", color: "#c70058" },
      interaction,
    );

  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Enter discord id", color: "#669917" },
    interaction,
  );
  const player_discord_id =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!player_discord_id)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not given discord id", color: "#c70058" },
      interaction,
    );

  const server_response = await game_server.byond_channel.request(
    {
      query: "certify_ckey",
      auth: game_server.settings_data.topic_token.data.setting,
      ckey: `${player_ckey}`,
      discord_id: `${player_discord_id}`,
    },
    {},
  );
  if (!server_response)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Try later\nStatuscode: 404\nReport to devs if persist",
        color: "#c70058",
      },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} ckey: [${player_ckey}], discord id: [${player_discord_id}], server response: [${server_response.statuscode}]-[${server_response.response}]`,
    game_server,
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Statuscode: ${server_response.statuscode}\nResponse: ${server_response.response}`,
      color: "#669917",
    },
    interaction,
  );
}

async function manageDecertifyCkey(interaction, game_server) {
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Enter player ckey", color: "#669917" },
    interaction,
  );
  const player_ckey =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!player_ckey)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not given ckey", color: "#c70058" },
      interaction,
    );

  const server_response = await game_server.byond_channel.request(
    {
      query: "decertify_ckey",
      auth: game_server.settings_data.topic_token.data.setting,
      ckey: `${player_ckey}`,
    },
    {},
  );
  if (!server_response)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Try later\nStatuscode: 404\nReport to devs if persist",
        color: "#c70058",
      },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} ckey: [${player_ckey}], server response: [${server_response.statuscode}]-[${server_response.response}]`,
    game_server,
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Statuscode: ${server_response.statuscode}\nResponse: ${server_response.response}`,
      color: "#669917",
    },
    interaction,
  );
}

async function manageDecertifyId(interaction, game_server) {
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Enter discord id", color: "#669917" },
    interaction,
  );
  const player_discord_id =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!player_discord_id)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not discord id", color: "#c70058" },
      interaction,
    );

  const server_response = await game_server.byond_channel.request(
    {
      query: "decertify_ckey",
      auth: game_server.settings_data.topic_token.data.setting,
      discord_id: `${player_discord_id}`,
    },
    {},
  );
  if (!server_response)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Try later\nStatuscode: 404\nReport to devs if persist",
        color: "#c70058",
      },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} discord id: [${player_discord_id}], server response: [${server_response.statuscode}]-[${server_response.response}]`,
    game_server,
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Statuscode: ${server_response.statuscode}\nResponse: ${server_response.response}`,
      color: "#669917",
    },
    interaction,
  );
}

/// MANAGE PLAYER

async function manageBanCkey(interaction, game_server) {
  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Enter player ckey", color: "#669917" },
    interaction,
  );
  const player_ckey =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!player_ckey)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not given ckey", color: "#c70058" },
      interaction,
    );

  let server_response;
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: "Attempting to lookup ckey...",
      color: "#c70058",
    },
    interaction,
  );
  server_response = await game_server.byond_channel.request(
    {
      query: "lookup_ckey",
      auth: game_server.settings_data.topic_token.data.setting,
      ckey: player_ckey,
    },
    {},
  );
  if (!server_response)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Try later\nStatuscode: 404\nReport to devs if persist",
        color: "#c70058",
      },
      interaction,
    );

  if (server_response.statuscode != 200)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: `Statuscode: ${server_response.statuscode}\nResponse: ${server_response.response}`,
        color: "#c70058",
      },
      interaction,
    );

  const ban_type = await globalThis.discord_client.sendInteractionSelectMenu(
    interaction,
    "Ban Type",
    [
      { label: "Перманентная Блокировка", value: "perma_ban" },
      { label: "Блокировка", value: "ban" },
      { label: "Перманентная Блокировка Роли", value: "role_perma_ban" },
      { label: "Блокировка Роли", value: "role_ban" },
    ],
    `Выберите тип блокировки для ${server_response.data.ckey}`,
  );
  if (!ban_type)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not selected ban type", color: "#c70058" },
      interaction,
    );

  const ban_data = { ckey: player_ckey, admin_id: interaction.user.id };
  switch (ban_type) {
    case "perma_ban":
      ban_data["bantype"] = 1;
      ban_data["duration"] = -1;
      ban_data["job"] = null;
      break;
    case "ban":
      ban_data["bantype"] = 2;
      ban_data["job"] = null;
      break;
    case "role_perma_ban":
      ban_data["bantype"] = 3;
      ban_data["duration"] = -1;
      ban_data["job"] = 1;
      break;
    case "role_ban":
      ban_data["bantype"] = 4;
      ban_data["job"] = 1;
      break;
  }

  if (ban_data["duration"] != -1) {
    await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Enter ban duration (minutes)",
        color: "#669917",
      },
      interaction,
    );
    ban_data["duration"] =
      await globalThis.discord_client.collectUserInput(interaction);
    if (!ban_data["duration"])
      return await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Request", desc: "Not set ban duration", color: "#c70058" },
        interaction,
      );
  }

  if (ban_data["job"]) {
    ban_data["job"] = await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Jobs",
      [
        { label: "Коммандные", value: "commanddept" },
        { label: "Щиткьюрити", value: "securitydept" },
        { label: "Инженерные", value: "engineeringdept" },
        { label: "Медики", value: "medicaldept" },
        { label: "Ученые", value: "sciencedept" },
        { label: "Каргоновцы", value: "supplydept" },
        { label: "Имигранты Ебаные", value: "civiliandept" },
        { label: "Педики (типо за права отвечают)", value: "lawdept" },
        { label: "Синтетика", value: "nonhumandept" },
        { label: "Гостроли", value: "ghostroles" },
        { label: "Антаги Ебучие", value: "teamantags" },
        {
          label: "Антаги Не Ебучие (рев, культ, ратвар, ксено)",
          value: "convertantags",
        },
        { label: "Другие Роли", value: "otherroles" },
        { label: "Апиренс", value: "appearance" },
        { label: "OOC", value: "ooc" },
        { label: "Срать Эмоутами", value: "emote" },
        { label: "Кликать Уга Буга РЕСПАВН", value: "respawnsystem" },
      ],
      `Выберите роли для блокировки для блокировки на ${(ban_data["duration"] / 60).toFixed(2)}ч`,
      true,
    );
    if (!ban_data["job"])
      return await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Request", desc: "Not selected jobs", color: "#c70058" },
        interaction,
      );
  }

  ban_data["severity"] =
    await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Severity",
      [
        { label: "High", value: "High" },
        { label: "Medium", value: "Medium" },
        { label: "Minor", value: "Minor" },
        { label: "None", value: "None" },
      ],
      `Выберите уровень нарушения`,
    );

  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Enter ban reason", color: "#669917" },
    interaction,
  );
  ban_data["reason"] =
    await globalThis.discord_client.collectUserInput(interaction);
  if (!ban_data["reason"])
    return await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Not given reason", color: "#c70058" },
      interaction,
    );

  await globalThis.discord_client.ephemeralEmbedEdit(
    { title: "Request", desc: "Attempting to send data...", color: "#c70058" },
    interaction,
  );
  server_response = await game_server.byond_channel.request(
    {
      query: "ban_ckey",
      auth: game_server.settings_data.topic_token.data.setting,
      ckey: `${player_ckey}`,
      ban_data: ban_data,
    },
    {},
  );
  if (!server_response)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: "Try later\nStatuscode: 404\nReport to devs if persist",
        color: "#c70058",
      },
      interaction,
    );

  if (server_response.statuscode != 200)
    return await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: `Statuscode: ${server_response.statuscode}\nResponse: ${server_response.response}`,
        color: "#c70058",
      },
      interaction,
    );

  globalThis.createLog(
    `${interaction.user.id} ckey: [${player_ckey}], server response: [${server_response.statuscode}]-[${server_response.response}], ban data: ${JSON.stringify(ban_data)}`,
    game_server,
  );
  await globalThis.discord_client.ephemeralEmbedEdit(
    {
      title: "Request",
      desc: `Statuscode: ${server_response.statuscode}\nResponse: ${server_response.response}`,
      color: "#669917",
    },
    interaction,
  );
}

/// REMAINING

async function updateServerCustomOperators(game_server) {
  if (
    game_server.update_custom_operators_data["intervals"]["events_messages"]
  ) {
    clearInterval(
      game_server.update_custom_operators_data["intervals"]["events_messages"],
    );
  }

  game_server.update_custom_operators_data["intervals"]["events_messages"] =
    setInterval(updateEventsMessages, 10 * 1000, game_server);
}

const handledEvents = {
  ban_a: handleABan,
  unban_a: handleAUnban,
  ban: handleBan,
  unban: handleUnban,
  notes: handleNotes,
};

async function updateEventsMessages(game_server) {
  try {
    const server_response = await game_server.byond_channel.request(
      {
        query: "receive_info",
        auth: game_server.settings_data.topic_token.data.setting,
      },
      { retries: 1, timeout: 10 * 1000 },
    );
    if (!server_response) throw "No response";

    if (server_response.statuscode != 200) return;

    let channel_id;
    if (server_response.data.events) {
      channel_id = await globalThis.mysqlRequest(
        globalThis.database,
        "SELECT channel_id FROM server_channels WHERE server = ? AND type = ?",
        [game_server.id, "events"],
      );
      if (channel_id.length) {
        for (const object of server_response.data.events) {
          if (!handledEvents[object.type]) continue;
          globalThis.addMessageToQueue(
            await handledEvents[object.type](object),
            channel_id[0].channel_id,
          );
        }
      }
    }

    if (server_response.data.ooc) {
      channel_id = await globalThis.mysqlRequest(
        globalThis.database,
        "SELECT channel_id FROM server_channels WHERE server = ? AND type = ?",
        [game_server.id, "ooc"],
      );
      if (channel_id.length) {
        for (const object of server_response.data.ooc) {
          globalThis.addMessageToQueue(
            new EmbedBuilder()
              .setTitle(" ")
              .setDescription(
                `OOC: ${object.author}: ${globalThis.stripDiscordFun(object.message)}`,
              )
              .setColor("#7289da"),
            channel_id[0].channel_id,
          );
        }
      }
    }

    if (server_response.data.admin) {
      channel_id = await globalThis.mysqlRequest(
        globalThis.database,
        "SELECT channel_id FROM server_channels WHERE server = ? AND type = ?",
        [game_server.id, "admin"],
      );
      if (channel_id.length) {
        for (const object of server_response.data.admin) {
          globalThis.addMessageToQueue(
            new EmbedBuilder()
              .setTitle(" ")
              .setDescription(
                `Asay: (${object.rank}) ${object.author}: ${globalThis.stripDiscordFun(object.message)}`,
              )
              .setColor("#7289da"),
            channel_id[0].channel_id,
          );
        }
      }
    }
  } catch (error) {
    if (error && error != "No response")
      globalThis._LogsHandler.sendSimplyLog(
        "Event Messages",
        null,
        globalThis.logWithID(),
        [{ name: "Warning", value: error }],
      );
  }
}

async function handleABan(data) {
  return new EmbedBuilder()
    .setTitle(data.title)
    .setDescription(
      `**Сикей:** ${data.player}\n**Админ:** ${data.admin}\n**Выдан:** ${data.bantimestamp}${data.banduration ? `\n**Время:** ${(data.banduration / 60).toFixed(2)}ч` : ""}\n**Причина:** ${globalThis.stripDiscordFun(data.reason)}\n**Раунд:** ${data.round}${data.additional_info?.ban_job ? `\n**Роль:** ${data.additional_info.ban_job}` : ""}`,
    )
    .setColor("#99174b");
}

async function handleAUnban(data) {
  return new EmbedBuilder()
    .setTitle(data.title)
    .setDescription(
      `**Сикей:** ${data.player}\n**Админ:** ${data.admin}\n**Раунд:** ${data.round}${data.additional_info?.ban_job ? `\n**Роль:** ${data.additional_info.ban_job}` : ""}`,
    )
    .setColor("#669917");
}

async function handleBan(data) {
  return new EmbedBuilder()
    .setTitle(data.temp ? "Блокировка" : "Перманентная Блокировка")
    .setDescription(
      `**Сикей:** ${data.player}\n**Админ:** ${data.admin}\n**Выдан:** ${data.bantimestamp}${data.banduration ? `\n**Время:** ${(data.banduration / 60).toFixed(2)}ч` : ""}\n**Причина:** ${globalThis.stripDiscordFun(data.reason)}\n**Раунд:** ${data.round}`,
    )
    .setColor("#991717");
}

async function handleUnban(data) {
  return new EmbedBuilder()
    .setTitle("Снятие Блокировки")
    .setDescription(
      `**Сикей:** ${data.player}\n**Админ:** ${data.admin}\n**Раунд:** ${data.round}`,
    )
    .setColor("#669917");
}

async function handleNotes(data) {
  return new EmbedBuilder()
    .setTitle("Нотес")
    .setDescription(
      `**Сикей:** ${data.player}\n**Админ:** ${data.admin_ckey}\n**Выдан:** ${data.timestamp}\n**Причина:** ${globalThis.stripDiscordFun(data.text)}\n**Раунд:** ${data.round}`,
    )
    .setColor("#173399");
}
