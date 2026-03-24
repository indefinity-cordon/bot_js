export default async function extendDiscordWHO(guild) {
  guild.extended_whomeme_listener = {
    function: null,
    params: [guild],
  };
  globalThis.events_listeners_links["messageCreate"].push(
    guild.extended_whomeme_listener,
  );
  initialize(guild);
  guild.modules["WhoMeme"] = initialize;
}

let locked_response_fun = false;

async function initialize(guild) {
  if (!guild.settings_data.whomeme?.data.setting) return;
  guild.extended_whomeme_listener["function"] = async (message, guild) => {
    if (
      message.channel.guild.id != guild.data.guild_id ||
      message.author.id !== "155734640705929216"
    )
      return;

    if (!locked_response_fun) return;

    const randomed = Math.random();
    if (randomed <= 0.01) {
      const randomed_link = await getRandomLink();
      if (randomed_link)
        globalThis.discord_client.sendEmbed(
          { content: randomed_link },
          message.channel,
        );
    } else if (randomed <= 0.02) {
      message.delete();
    } else return;

    locked_response_fun = true;
    setTimeout(() => {
      locked_response_fun = false;
    }, 5 * 60000);
  };
}

// CO authored, discord gifs list by: <@363331475069861899> (discord user)
globalThis.locked_response_fun = false;

//Я ебал в рот ваши показатели веса у каждого на шанс выпадения, еще две штуки вснулу и шанс выше, уга буга, машину стукать, она работать! Стукать сильнее, она работать лучше!!!
const links = [
  "1335613117161406526",
  "1335613117161406526",
  "1335613117161406526",
  "1335613141274460201",
  "1335613141274460201",
  "1335613141274460201",
  "1335613152695681115",
  "https://tenor.com/view/blocked-message-gif-24291794",
  "https://tenor.com/view/blocked-message-gif-24291794",
  "https://tenor.com/view/nahryuk-pig-blocked-%D0%B2%D0%B0%D1%88-%D0%BD%D0%B0%D1%85%D1%80%D1%8E%D0%BA-gif-526781935772232634",
  "https://tenor.com/view/nahryuk-pig-blocked-%D0%B2%D0%B0%D1%88-%D0%BD%D0%B0%D1%85%D1%80%D1%8E%D0%BA-gif-526781935772232634",
  "https://tenor.com/view/talk-lizard-ironic-gif-25847938",
  "https://tenor.com/view/talk-lizard-ironic-gif-25847938",
  "https://tenor.com/view/talk-lizard-ironic-gif-25847938",
  "https://tenor.com/view/talk-lizard-ironic-gif-25847938",
  "https://tenor.com/view/ga-ga-ga-gif-540832443768704677",
  "https://tenor.com/view/mortal-kombat-skull-emoji-gif-25107751",
  "https://tenor.com/view/stupidity-look-serius-gif-26117549",
  "https://tenor.com/view/sus-scout-lachen-tf2-gif-17981608274864336621",
  "https://tenor.com/view/rat-rodent-vermintide-vermintide2-skaven-gif-20147931",
];
const id_messages = {
  "1335613117161406526": "1210262492685541406",
  "1335613141274460201": "1210262492685541406",
  "1335613152695681115": "1210262492685541406",
};
async function getRandomLink() {
  const index = Math.floor(Math.random() * links.length);
  const won_result = links[index];
  if (id_messages[won_result]) {
    const channel = await globalThis.discord_client.channels.fetch(
      id_messages[won_result],
    );
    let found_message = null;
    if (!(await globalThis.discord_client.HasPermsAccess(channel, false)))
      return;
    await channel.messages.fetch().then((messages) => {
      for (const message of messages) {
        if (message[1].id === won_result) {
          found_message = message[1];
        }
      }
    });
    if (found_message) return found_message.content;
    globalThis.custom_error_log(
      `CORE >> SEDALYA PUKA >> [ERROR] >> UNABLE TO FIND ${won_result}`,
    );
    return;
  }
  return won_result;
}
