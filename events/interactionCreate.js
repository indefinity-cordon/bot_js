export default async function interactionCreate(interaction) {
  // Commands
  if (interaction.isCommand() || interaction.isUserContextMenuCommand()) {
    const cmd = globalThis.discord_client.commands.get(interaction.commandName);
    if (cmd) {
      cmd.run(interaction, interaction.options._hoistedOptions).catch((err) => {
        globalThis.discord_client.emit(
          "errorCreate",
          err,
          interaction.commandName,
          interaction,
        );
      });
    }
  }

  //Currently not used, because I lazy, sometimme later
  if (interaction.isButton()) {
    //		let buttonID = interaction.customId.split("-");
    //TODO: Fun here
  }

  if (interaction.isStringSelectMenu()) {
    //TODO: Fun here
  }
}
