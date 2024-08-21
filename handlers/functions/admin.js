const Discord = require('discord.js');

module.exports = async (client) => {
    client.handleServerDataSelection = async function (interaction) {
        return;
    };
    client.handling_commands_actions["admin_actions"] = client.handleServerDataSelection;
    client.handling_commands.push({ label: "Admin Actions", value: "admin_actions", role_req: "admin_role_id" });
}