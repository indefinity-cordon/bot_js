import { EmbedBuilder, MessageFlags } from "discord.js";

/**
 * @param {String} text
 * @param {TextChannel} channel
 */

export default function declareEmbeds() {
  globalThis.discord_client.templateEmbed = function () {
    return new EmbedBuilder().setColor("#42ab3e").setTimestamp();
  };

  //----------------------------------------------------------------//
  //                        BASIC MESSAGES                          //
  //----------------------------------------------------------------//

  globalThis.discord_client.ephemeralEmbed = async function (
    { title, desc, color, content, components },
    interaction,
  ) {
    return globalThis.discord_client.simpleEmbed(
      {
        title: title,
        desc: desc,
        color: color,
        content: content,
        components: components || [],
        type: "ephemeral",
      },
      interaction,
    );
  };

  globalThis.discord_client.ephemeralEmbedEdit = async function (
    { title, desc, color, content, components },
    interaction,
  ) {
    return globalThis.discord_client.simpleEmbed(
      {
        title: title,
        desc: desc,
        color: color,
        content: content,
        components: components || [],
        type: "ephemeraledit",
      },
      interaction,
    );
  };

  // Default
  globalThis.discord_client.embed = async function (
    {
      embed = globalThis.discord_client.templateEmbed(),
      title,
      desc,
      color,
      image,
      author,
      url,
      footer,
      thumbnail,
      fields,
      content,
      components,
      type,
    },
    interaction,
  ) {
    if (interaction.guild == undefined) interaction.guild = { id: "0" };
    if (title) embed.setTitle(title);
    if (desc && desc.length >= 2048)
      embed.setDescription(desc.substr(0, 2044) + "...");
    else if (desc) embed.setDescription(desc);
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (fields) embed.addFields(fields);
    if (author) embed.setAuthor(author);
    if (url) embed.setURL(url);
    if (footer) embed.setFooter({ text: footer });
    if (color) embed.setColor(color);
    return globalThis.discord_client.sendEmbed(
      {
        embeds: [embed],
        content: content,
        components: components,
        type: type,
      },
      interaction,
    );
  };

  globalThis.discord_client.simpleEmbed = async function (
    {
      title,
      desc,
      color,
      image,
      author,
      thumbnail,
      fields,
      url,
      content,
      components,
      type,
    },
    interaction,
  ) {
    let embed = new EmbedBuilder().setColor("#42ab3e");

    if (title) embed.setTitle(title);
    if (desc && desc.length >= 2048)
      embed.setDescription(desc.substr(0, 2044) + "...");
    else if (desc) embed.setDescription(desc);
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (fields) embed.addFields(fields);
    if (author) embed.setAuthor(author[0], author[1]);
    if (url) embed.setURL(url);
    if (color) embed.setColor(color);

    return globalThis.discord_client.sendEmbed(
      {
        embeds: [embed],
        content: content,
        components: components,
        type: type,
      },
      interaction,
    );
  };

  globalThis.discord_client.sendEmbed = async function (
    { embeds = [], content = " ", components = [], type },
    interaction,
  ) {
    if (type && type.toLowerCase() == "reply") {
      if (
        await globalThis.discord_client.HasPermsWriteAccess(interaction.channel)
      )
        return;
      return await interaction
        .reply({
          embeds: embeds,
          content: content,
          components: components,
          withResponse: true,
        })
        .catch(() => {});
    } else if (type && type.toLowerCase() == "editreply") {
      return await interaction
        .editReply({
          embeds: embeds,
          content: content,
          components: components,
          withResponse: true,
        })
        .catch(() => {});
    } else if (type && type.toLowerCase() == "edit") {
      return await interaction
        .edit({
          embeds: embeds,
          content: content,
          components: components,
          withResponse: true,
        })
        .catch(() => {});
    } else if (type && type.toLowerCase() == "update") {
      return await interaction
        .update({
          embeds: embeds,
          content: content,
          components: components,
          withResponse: true,
        })
        .catch(() => {});
    } else if (type && type.toLowerCase() == "ephemeral") {
      return await interaction
        .reply({
          embeds: embeds,
          content: content,
          components: components,
          withResponse: true,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    } else if (type && type.toLowerCase() == "ephemeraledit") {
      return await interaction
        .editReply({
          embeds: embeds,
          content: content,
          components: components,
          withResponse: true,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    } else {
      if (
        await globalThis.discord_client.HasPermsWriteAccess(interaction.channel)
      )
        return;
      return await interaction
        .send({
          embeds: embeds,
          content: content,
          components: components,
          withResponse: true,
        })
        .catch(() => {});
    }
  };
}
