import {
  PermissionsBitField,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";

export default async function loadFunctions() {
  //----------------------------------------------------------------//
  //                         Permissions                            //
  //----------------------------------------------------------------//
  // All bitfields to name
  globalThis.discord_client.bitfieldToName = function (bitfield) {
    const permissions = new PermissionsBitField(bitfield);
    return permissions.toArray();
  };

  globalThis.discord_client.checkPerms = async function (
    { flags },
    interaction,
  ) {
    for (const element of flags) {
      if (!interaction.member.permissions.has(element)) {
        globalThis.discord_client.errMissingPerms(
          {
            perms: globalThis.discord_client.bitfieldToName(element) || element,
            type: "editreply",
          },
          interaction,
        );

        return false;
      }
      if (!interaction.guild.members.me.permissions.has(element)) {
        globalThis.discord_client.errNoPerms(
          {
            perms: globalThis.discord_client.bitfieldToName(element) || element,
            type: "editreply",
          },
          interaction,
        );

        return false;
      }
    }
  };

  globalThis.discord_client.checkBotPerms = async function (
    { flags },
    interaction,
  ) {
    for (const element of flags) {
      if (!interaction.guild.members.me.permissions.has(element)) {
        globalThis.discord_client.errNoPerms(
          {
            perms: globalThis.discord_client.bitfieldToName(element) || element,
            type: "editreply",
          },
          interaction,
        );

        return false;
      }
    }
  };

  globalThis.discord_client.checkUserPerms = async function (
    { flags },
    interaction,
  ) {
    for (const element of flags) {
      if (!interaction.member.permissions.has(element)) {
        globalThis.discord_client.errMissingPerms(
          {
            perms: globalThis.discord_client.bitfieldToName(element) || element,
            type: "editreply",
          },
          interaction,
        );

        return false;
      }
    }
  };

  globalThis.discord_client.generateEmbed = async function (
    start,
    end,
    lb,
    title,
  ) {
    const current = lb.slice(start, end + 10);
    const result = current.join("\n");

    let embed = globalThis.discord_client
      .templateEmbed()
      .setTitle(`${title}`)
      .setDescription(`${result.toString()}`);

    return embed;
  };

  //----------------------------------------------------------------//
  //                         Selection Menu                         //
  //----------------------------------------------------------------//
  globalThis.discord_client.activeCollectors = {};
  globalThis.discord_client.sendInteractionSelectMenu = async function (
    interaction,
    custom_desc,
    custom_options,
    custom_content,
    allow_multiple = false,
  ) {
    if (custom_options.length > 25) {
      return globalThis.discord_client.sendPaginatedSelectMenu(
        interaction,
        custom_desc,
        custom_options,
        custom_content,
        allow_multiple,
      );
    }

    const custom_id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const menu = new StringSelectMenuBuilder()
      .setCustomId(custom_id)
      .setPlaceholder(custom_desc)
      .addOptions(custom_options);
    if (allow_multiple) {
      menu.setMinValues(1);
      menu.setMaxValues(custom_options.length);
    }

    const message = await globalThis.discord_client.ephemeralEmbedEdit(
      {
        title: "Request",
        desc: custom_content,
        color: "#669917",
        components: [new ActionRowBuilder().addComponents(menu)],
      },
      interaction,
    );

    const filter = (collected) =>
      collected.customId === custom_id &&
      collected.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter,
      time: 60000,
    });
    globalThis.discord_client.activeCollectors[custom_id] = collector;

    return new Promise((resolve) => {
      collector.on("collect", async (collected) => {
        collector.stop();
        await collected.deferUpdate();
        delete globalThis.discord_client.activeCollectors[custom_id];

        if (allow_multiple) {
          resolve(collected.values);
        } else {
          resolve(collected.values[0]);
        }
      });

      collector.on("end", async (collected, reason) => {
        if (reason === "time" && !collected.size) {
          await globalThis.discord_client.ephemeralEmbedEdit(
            {
              title: "Request",
              desc: "Time ran out! Please try again.",
              color: "#c70058",
            },
            interaction,
          );
          resolve();
        }
        if (globalThis.discord_client.activeCollectors[custom_id])
          delete globalThis.discord_client.activeCollectors[custom_id];
      });
    });
  };

  globalThis.discord_client.sendPaginatedSelectMenu = async function (
    interaction,
    custom_desc,
    custom_options,
    custom_content,
    allow_multiple = false,
    per_page = 25,
  ) {
    const custom_id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const button_prev = `button_prev_${custom_id}`;
    const button_next = `button_next_${custom_id}`;
    const totalPages = Math.ceil(custom_options.length / per_page);
    const sendPage = async (page) => {
      const start = page * per_page;
      const end = start + per_page;
      const current_options = custom_options.slice(start, end);
      const menu = new StringSelectMenuBuilder()
        .setCustomId(custom_id)
        .setPlaceholder(custom_desc)
        .addOptions(current_options);
      if (allow_multiple) {
        menu.setMinValues(1);
        menu.setMaxValues(current_options.length);
      }
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(button_prev)
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(button_next)
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1),
      );
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: `Page ${page + 1}/${totalPages}: ${custom_content}`,
          color: "#669917",
          components: [new ActionRowBuilder().addComponents(menu), buttons],
        },
        interaction,
      );
    };
    let current_page = 0;
    const message = await sendPage(current_page);

    const filter = (collected) =>
      [button_prev, button_next, custom_id].includes(collected.customId) &&
      collected.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({
      filter,
      time: 60000,
    });
    globalThis.discord_client.activeCollectors[custom_id] = collector;

    return new Promise((resolve) => {
      collector.on("collect", async (collected) => {
        await collected.deferUpdate();

        if (collected.customId === button_prev && current_page > 0) {
          current_page--;
          await sendPage(current_page);
        } else if (
          collected.customId === button_next &&
          current_page < totalPages - 1
        ) {
          current_page++;
          await sendPage(current_page);
        } else {
          collector.stop();
          delete globalThis.discord_client.activeCollectors[custom_id];
          if (allow_multiple) {
            resolve(collected.values);
          } else {
            resolve(collected.values[0]);
          }
        }
      });

      collector.on("end", async (collected, reason) => {
        if (reason === "time" && !collected.size) {
          await globalThis.discord_client.ephemeralEmbedEdit(
            {
              title: "Request",
              desc: "Time ran out! Please try again.",
              color: "#c70058",
            },
            interaction,
          );
          resolve();
        }
        if (globalThis.discord_client.activeCollectors[custom_id])
          delete globalThis.discord_client.activeCollectors[custom_id];
      });
    });
  };

  globalThis.discord_client.collectUserInput = async function (interaction) {
    const filter = (collected) => collected.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({
      filter,
      max: 1,
      time: 60000,
      errors: ["time"],
    });

    if (!collected.size) {
      await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "Time ran out! Please try again.",
          color: "#c70058",
        },
        interaction,
      );
      return null;
    }

    return collected.first().content;
  };

  globalThis.discord_client.HasPermsWriteAccess = async function (
    channel,
    log = true,
    perms_check = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
    ],
  ) {
    return await globalThis.discord_client.HasPermsAccess(
      channel,
      log,
      perms_check,
    );
  };

  globalThis.discord_client.HasPermsAccess = async function (
    channel,
    log = true,
    perms_check = [PermissionsBitField.Flags.ViewChannel],
  ) {
    if (!channel?.guild) return false;

    const member = channel.guild.members.me;
    const perms = await channel.permissionsFor(member);
    if (!perms) return perms_check;

    if (
      channel.isThread() &&
      perms_check.includes(PermissionsBitField.Flags.SendMessages)
    ) {
      perms_check.splice(
        perms_check.indexOf(PermissionsBitField.Flags.SendMessages),
        1,
        PermissionsBitField.Flags.SendMessagesInThreads,
      );
      if (channel.locked) return perms_check;
    }

    const missing_perms = perms.missing(perms_check);
    if (missing_perms.length && log)
      globalThis._LogsHandler.sendSimplyLog(
        `Perms >> [ERROR] >> Can't send message in channel: ${channel.id}, missing: ${missing_perms.join(", ")}`,
      );
    return missing_perms.length ? missing_perms : false;
  };
}
