export default async function Qxecute() {
  globalThis.handling_commands_actions["exec_request"] = handleServerManagement;
  globalThis.handling_commands.push({
    label: "EXECUTE",
    value: "exec_request",
    role_req: "secret_role_id",
  });

  async function handleServerManagement(interaction) {
    await globalThis.discord_client.ephemeralEmbedEdit(
      { title: "Request", desc: "Enter the request", color: "#669917" },
      interaction,
    );
    const request =
      await globalThis.discord_client.collectUserInput(interaction);
    if (!request)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Request", desc: "Not given SQL request", color: "#c70058" },
        interaction,
      );

    const { exec } = await import("node:child_process");
    exec(request, async (error, stdout, stderr) => {
      //			console.log('EXECUTE >> [OUTPUT] >> ', `stdout: ${stdout}`, `stderr: ${stderr}`);
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          color: "#c70058",
          content: `stdout: ${stdout}\nstderr: ${stderr}`,
        },
        interaction,
      );
    });
  }
}
