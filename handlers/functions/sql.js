export default async function SQL() {
  globalThis.handling_commands_actions["sql_request"] = handleServerManagement;
  globalThis.handling_commands.push({
    label: "SQL",
    value: "sql_request",
    role_req: "secret_role_id",
  });

  async function handleServerManagement(interaction) {
    let options = [{ label: "Bot DB", value: "bot" }];
    for (const server_name in globalThis.servers_link) {
      if (!globalThis.servers_link[server_name].game_connection) continue;
      options.push({ label: server_name, value: server_name });
    }
    const server = await globalThis.discord_client.sendInteractionSelectMenu(
      interaction,
      "Select DB",
      options,
      "Please select a db:",
    );
    if (!server) return;

    await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Enter the request", color: "#669917" },
      interaction,
    );
    const sql_request =
      await globalThis.discord_client.collectUserInput(interaction);
    if (!sql_request)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Request", desc: "Not given SQL request", color: "#c70058" },
        interaction,
      );

    let result;
    try {
      result = await globalThis.mysqlRequest(
        server != "bot"
          ? globalThis.servers_link[server].game_connection
          : globalThis.database,
        `${sql_request}`,
      );
      //console.log('DB >> [OUTPUT] >> ', result);
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          color: "#c70058",
          content: JSON.stringify(result) || "Unknown error",
        },
        interaction,
      );
    } catch (error) {
      //console.log('DB >> [ERROR] >> ', error);
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          color: "#c70058",
          content: error.message || "Unknown error",
        },
        interaction,
      );
    }
  }
}
