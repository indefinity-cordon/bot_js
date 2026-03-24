import { EmbedBuilder } from "discord.js";

export default async function extendStatus(game_server) {
  initialize(game_server);
  game_server.modules["Status"] = initialize;
}

async function initialize(game_server) {
  game_server.announced_start = false;
  game_server.check_alive_running = false;
  game_server.old_time = 1;
  game_server.delayed_timeout = null;
  game_server.handling_updaters["message_status"] = updateStatusMessage;
  game_server.announceStart = announceStart;
}

async function updateStatusMessage(type, game_server) {
  let embed = new EmbedBuilder().setTitle(" ").setTimestamp();
  let content = `${game_server.data.server_name} Статус`;

  const server_response = await game_server.byond_channel.request(
    {
      query: "status_authed",
      auth: game_server.settings_data.topic_token.data.setting,
    },
    { retries: 1, timeout: 10 * 1000 },
  );
  if (server_response) {
    if (server_response.data.delay) {
      content += " [ЗАДЕРЖАН]";
      if (game_server.delayed_timeout)
        checkDelay(game_server, server_response.data.players);
    } else if (game_server.delayed_timeout) announceDelayEnd(game_server);

    const time = Math.floor(server_response.data.round_duration / 60);
    const fields = [
      //TODO: Сделать примейды, что бы глобальный аррей проверяло на объекты и если совпадал брало там текст и заполнение, короче без ебли в 3 строчки кода что бы.
      {
        name: "**ID Раунда**",
        value: `${server_response.data.round_id} `,
        inline: true,
      },
      {
        name: "**Игроков**",
        value: `${server_response.data.players} `,
        inline: true,
      },
      {
        name: "**Время раунда**",
        value: `${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, "0"),
        inline: true,
      },
    ];

    for (const [name, value, requirement_function] of game_server.settings_data
      .status_mapping.param) {
      if (!server_response.data[value]) continue;

      // Это безопасно, trust me, I'm and engineer
      const evaluated_function = eval(requirement_function);
      if (evaluated_function && !evaluated_function(server_response.data))
        continue;

      fields.push({
        name: name,
        value: `${server_response.data[value]} `,
        inline: true,
      });
    }

    if (game_server.old_time > time) handleRoundStart(game_server);
    game_server.old_time = time;
    embed.addFields(fields).setColor("#669917");
  } else {
    if (
      !game_server.check_alive_running &&
      game_server.settings_data.server_status.data.setting
    )
      checkStatus(game_server);
    embed.setDescription("# ВЫКЛЮЧЕН").setColor("#a00f0f");
  }
  for (const message of game_server.updater_messages[type]) {
    await globalThis.discord_client.sendEmbed(
      { embeds: [embed], content: content, components: [], type: "edit" },
      message,
    );
  }
}

async function handle_status(game_server, new_status) {
  if (game_server.settings_data.server_status.data.setting == new_status)
    return true;
  game_server.settings_data.server_status.data.setting = new_status;

  const status = await globalThis.mysqlRequest(
    globalThis.database,
    "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'",
    [game_server.id],
  );
  const channel = await globalThis.discord_client.channels.fetch(
    status[0].channel_id,
  );
  if (!channel) return;

  if (!new_status) {
    game_server.announced_start = false;
    globalThis.discord_client.sendEmbed(
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
    return;
  }

  if (!game_server.announced_start) announceStart(game_server);
  if (!Number.parseInt(game_server.settings_data.auto_delay.data.setting))
    return;

  await game_server.byond_channel.request(
    {
      query: "set_delay",
      auth: game_server.settings_data.topic_token.data.setting,
      delay: 1,
    },
    {},
  );
  game_server.delayed_timeout = setTimeout(
    announceDelayEnd,
    game_server.settings_data.auto_delay.data.setting * 60000,
    game_server,
  );
}

async function checkStatus(game_server) {
  game_server.check_alive_running = true;
  const server_response = await game_server.byond_channel.request(
    {
      query: "status_authed",
      auth: game_server.settings_data.topic_token.data.setting,
    },
    { retries: 15, timeout: 10 * 1000 },
  );
  if (!server_response) handle_status(game_server, 0);
  game_server.check_alive_running = false;
}

async function announceStart(game_server) {
  game_server.announced_start = true;
  globalThis.discord_client.tgs_softShutdown(
    game_server.data.tgs_address,
    game_server.data.tgs_login,
    game_server.data.tgs_pass,
    game_server.data.tgs_id,
    null,
    false,
  );

  const status = await globalThis.mysqlRequest(
    globalThis.database,
    "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'",
    [game_server.id],
  );
  const channel = await globalThis.discord_client.channels.fetch(
    status[0].channel_id,
  );
  if (!channel) return;

  let content = " ";
  let color = "#669917";
  if (game_server.settings_data.start_role_id_ping) {
    const role = channel.guild.roles.cache.find(
      (role) =>
        role.id == game_server.settings_data.start_role_id_ping.data.setting,
    );
    if (role) {
      content = `<@&${role.id}>`;
      color = role.hexColor;
    }
  }
  await globalThis.discord_client.sendEmbed(
    {
      embeds: [
        new EmbedBuilder()
          .setTitle(" ")
          .setDescription(`Запуск!`)
          .setColor(color),
      ],
      content: content,
    },
    channel,
  );
}

async function handleRoundStart(game_server) {
  if (!(await handle_status(game_server, 1))) return;

  if (
    Number.parseInt(
      game_server.settings_data.player_low_autoshutdown?.data.setting,
    )
  ) {
    const server_response = await game_server.byond_channel.request(
      {
        query: "status_authed",
        auth: game_server.settings_data.topic_token.data.setting,
      },
      {},
    );
    if (
      server_response &&
      server_response.data.players <
        game_server.settings_data.player_low_autoshutdown.data.setting
    ) {
      globalThis.discord_client.tgs_softShutdown(
        game_server.data.tgs_address,
        game_server.data.tgs_login,
        game_server.data.tgs_pass,
        game_server.data.tgs_id,
        null,
        true,
      );
    }
  }

  const status = await globalThis.mysqlRequest(
    globalThis.database,
    "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'",
    [game_server.id],
  );

  if (!status.length) return;

  const channel = await globalThis.discord_client.channels.fetch(
    status[0].channel_id,
  );
  if (!channel) return;

  let content = " ";
  let color = "#669917";
  if (game_server.settings_data.new_round_role_id_ping) {
    const role = channel.guild.roles.cache.find(
      (role) =>
        role.id ==
        game_server.settings_data.new_round_role_id_ping.data.setting,
    );
    if (role) {
      content = `<@&${role.id}>`;
      color = role.hexColor;
    }
  }
  globalThis.discord_client.sendEmbed(
    {
      embeds: [
        new EmbedBuilder()
          .setTitle("Новый раунд начался!")
          .setDescription(" ")
          .setColor(color),
      ],
      content: content,
    },
    channel,
  );
}

async function checkDelay(game_server, players) {
  if (
    !Number.parseInt(
      game_server.settings_data.player_low_autoshutdown.data.setting,
    )
  )
    return;
  if (
    players <=
    game_server.settings_data.player_low_autoshutdown.data.setting * 2
  )
    return;

  game_server.byond_channel.request(
    {
      query: "set_delay",
      auth: game_server.settings_data.topic_token.data.setting,
      delay: 2,
    },
    {},
  );
  announceDelayEnd(game_server);
}

async function announceDelayEnd(game_server) {
  clearTimeout(game_server.delayed_timeout);
  game_server.delayed_timeout = null;
  const status = await globalThis.mysqlRequest(
    globalThis.database,
    "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'",
    [game_server.id],
  );
  const channel = await globalThis.discord_client.channels.fetch(
    status[0].channel_id,
  );
  if (!channel) return;

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
