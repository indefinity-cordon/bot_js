const Discord = require('discord.js');

module.exports = async (client) => {
    client.handleServerDataSelection = async function (interaction) {
        return;
    };
    global.handling_commands_actions["admins"] = client.handleServerDataSelection;
    global.handling_commands.push({ label: "Manage TGS", value: "tgs", role_req: "admin_role_id" });
}