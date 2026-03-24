import { EmbedBuilder } from "discord.js";

export default async function extendSchedule(game_server) {
  initialize(game_server);
  game_server.modules["Schedule"] = initialize;
}

async function initialize(game_server) {
  game_server.handling_updaters["message_schedule"] = updateScheduleMessage;
  game_server.handling_actions["manage_autostart"] = configureAutoStartMenu;
  game_server.handling_commands.push({
    label: "Manage Auto Start",
    value: "manage_autostart",
  });
  game_server.updaters_poll.push(update);
}

async function update(game_server) {
  if (!game_server.settings_data.auto_start_config) return;

  const server_schedule_data =
    game_server.settings_data.auto_start_config.param;

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
            game_server.announceStart(game_server);
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
            game_server.announceStart(game_server);
          }, time_remaining);
      }
    }
  }
}

async function updateScheduleMessage(type, game_server) {
  try {
    const server_schedule_data = await getSchedule(
      game_server.settings_data.auto_start_config.param,
    );
    if (!server_schedule_data)
      throw new Error("Something went wrong in getSchedule module");

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
          content: `${game_server.data.server_name} расписание стартов`,
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
          content: `${game_server.data.server_name} расписание стартов`,
          components: [],
          type: "edit",
        },
        message,
      );
    }
  }
}

async function configureAutoStartMenu(interaction, game_server) {
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
        { label: "Посмотреть", value: "view" },
        { label: "Установить режим", value: "set_mode" },
        { label: "Установить Подневный Режим", value: "set_daily_time" },
        { label: "Убрать Подневный Режим", value: "remove_daily_time" },
        { label: "Поставить Одиночные Дни", value: "set_specific_days" },
        { label: "Убрать Одиночные Дни", value: "remove_specific_days" },
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
}

async function getSchedule(server_schedule_data) {
  const day_ru_names = {
    monday: "Понедельник",
    tuesday: "Вторник",
    wednesday: "Среда",
    thursday: "Четверг",
    friday: "Пятница",
    saturday: "Суббота",
    sunday: "Воскресенье",
  };
  const now = new Date();
  let schedule = " ";
  if (server_schedule_data.daily) {
    schedule += "**Дневное Расписание:**\n";
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
      schedule += `- ${day_ru_names[day]}: <t:${Math.floor(start_time.getTime() / 1000)}:t>\n`;
    }
  }
  if (server_schedule_data.spec) {
    schedule += "\n**Специфичные Даты:**\n";
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
    schedule += "Не настроено.";
  }
  return schedule;
}

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
        { label: "Понедельник", value: "monday" },
        { label: "Вторник", value: "tuesday" },
        { label: "Среда", value: "wednesday" },
        { label: "Четверг", value: "thursday" },
        { label: "Пятница", value: "friday" },
        { label: "Суббота", value: "saturday" },
        { label: "Воскресенье", value: "sunday" },
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
