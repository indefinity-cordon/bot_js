const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = (client) => {
    client.redisCallback = async function (data) {
        if (!data) {
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(`Malformed Redis message, without data.`));
            return;
        }

        const instances = await client.tgs_getInstances();
        const responded_instance = instances.find(instance => instance.name === data.source);
        if (!responded_instance) {
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(`Failed to find server instance. Aborting. data: ${data.source}, instances found: ${JSON.stringify(instances)}`));
            return;
        }

        let responded_game_server;
        for (const server_name in client.servers_link) {
            let game_server = client.servers_link[server_name];
            if (game_server.tgs_id == responded_instance.id) {
                responded_game_server = game_server;
                break;
            }
        }

        if (!responded_game_server) {
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(`Failed to find server object. Aborting. data: ${data.source}, instance id: ${responded_instance.id}`));
            return;
        }

        const status = await client.databaseRequest(client.database, "SELECT channel_id, message_id FROM server_channels WHERE server_name = ? AND type = ?", [responded_game_server.server_name, data.type]);
        if (!status.length) {
            console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL`), chalk.red(`Failed to find server related feed channels. Aborting. data: ${JSON.stringify(data)}`));
            return;
        }

        const channel = await client.channels.fetch(status[0].channel_id);
        if (!channel) {
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(`Failed to find server related feed channels. Aborting. data: ${JSON.stringify(data)}`));
            return;
        }
//TODO Relocate it to server side
        switch (data.state) {
            case "ooc":
                await handleOOC(channel, data);
                break;
            case "start":
                await handleRoundStart(channel);
                break;
            case "predator":
                await handlePredator(channel);
                break;
            case "ahelp":
                await handleAhelp(channel, data);
                break;
            case "add_time_ban":
                await handleTimeBan(channel, data, "add", responded_game_server);
                break;
            case "remove_time_ban":
                await handleTimeBan(channel, data, "remove", responded_game_server);
                break;
            case "add_job_ban":
                await handleJobBan(channel, data, "add", responded_game_server);
                break;
            case "remove_job_ban":
                await handleJobBan(channel, data, "remove", responded_game_server);
                break;
            case "add_perma_ban":
                await handlePermaBan(channel, data, "add", responded_game_server);
                break;
            case "remove_perma_ban":
                await handlePermaBan(channel, data, "remove", responded_game_server);
                break;
            case "auto_unban":
                await handleAutoUnban(channel, data, responded_game_server);
                break;
            case "auto_unjobban":
                await handleAutoUnjobban(channel, data, responded_game_server);
                break;
            case "asay":
                await handleAsay(channel, data);
                break;
            case "fax":
                await handleFax(channel, data);
                break;
            case "login":
                await handleLogin(channel, data);
                break;
            case "logout":
                await handleLogout(channel, data);
                break;
            default:
                console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Unknown state received: ${data.state}`));
                break;
        }
    };

//TODO: Replace this garbage with normal embed: new Discord.EmbedBuilder() and then params
    async function handleOOC(channel, data) {
        const messageContent = data.message
            .replace(/<@&(\d+)>/g, ' ')
            .replace(/<@!?(\d+)>/g, ' ')
            .replace(/https?:\/\/\S+/g, ' ')
            .replace(/@everyone/g, ' ')
            .replace(/@here/g, ' ');
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle(` `).setDescription(`OOC: ${data.author}: ${messageContent}`).setColor('#7289da')]}, channel)
    };

    async function handleRoundStart(channel) {
        const role = channel.guild.roles.cache.find(role => role.name === `Round Alert`);
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle(`NEW ROUND!`).setDescription(` `).setColor(role.hexColor)], content: `<@&${role.id}>`}, channel)
    };

    async function handlePredator(channel) {
        const role = channel.guild.roles.cache.find(role => role.name === `Predator gamer`);
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle(`PREDATOR ROUND!`).setDescription(` `).setColor(role.hexColor)], content: `<@&${role.id}>`}, channel)
    };

    async function handleAhelp(channel, data) {
        const embed = {
            title: data.embed.title,
            desc: data.embed.desc,
            fields: data.embed.fields,
            footer: data.embed.footer,
            content: data.embed.content,
            url: data.embed.url,
            author: data.embed.author,
            color: `#5a2944`
        };
        await client.embed(embed, channel)
    };

    async function handleTimeBan(channel, data, action, responded_game_server) {
        const player = await fetchPlayerById(data.ref_player_id, responded_game_server.game_connection);
        const embed = {
            title: `Time Ban ${action === "add" ? "Added" : "Removed"}`,
            desc: `Player: ${player.ckey}\nReason: ${player.time_ban_reason}\nExpiration: ${formatTimestamp(player.time_ban_expiration)}`,
            color: action === "add" ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel)
    };

    async function handleJobBan(channel, data, action, responded_game_server) {
        const player = await fetchPlayerById(data.ref_player_id, responded_game_server.game_connection);
        const jobBan = await fetchJobBanByPlayerId(data.ref_player_id, responded_game_server.game_connection);
        const embed = {
            title: `Job Ban ${action === "add" ? "Added" : "Removed"}`,
            desc: `Player: ${player.ckey}\nRole: ${jobBan.role}\nReason: ${jobBan.text}\nExpiration: ${formatTimestamp(jobBan.expiration)}`,
            color: action === "add" ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel)
    };

    async function handlePermaBan(channel, data, action, responded_game_server) {
        const player = await fetchPlayerById(data.ref_player_id, responded_game_server.game_connection);
        const embed = {
            title: `Perma Ban ${action === "add" ? "Added" : "Removed"}`,
            desc: `Player: ${player.ckey}\nReason: ${player.permaban_reason}`,
            color: action === "add" ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel)
    };

    async function handleAutoUnban(channel, data, responded_game_server) {
        const player = await fetchPlayerById(data.ref_player_id, responded_game_server.game_connection);
        const embed = {
            title: `Auto Unban`,
            desc: `Player: ${player.ckey} has been automatically unbanned.`,
            color: '#00ff00'
        };
        await client.embed(embed, channel)
    };

    async function handleAutoUnjobban(channel, data, responded_game_server) {
        const player = await fetchPlayerById(data.ref_player_id, responded_game_server.game_connection);
        const embed = {
            title: `Auto Unjobban`,
            desc: `Player: ${player.ckey} has been automatically unjobbanned.`,
            color: '#00ff00'
        };
        await client.embed(embed, channel)
    };

    async function handleAsay(channel, data) {
        const messageContent = data.message
            .replace(/<@&(\d+)>/g, ' ')
            .replace(/<@!?(\d+)>/g, ' ')
            .replace(/https?:\/\/\S+/g, ' ')
            .replace(/@everyone/g, ' ')
            .replace(/@here/g, ' ');
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle(` `).setDescription(`Asay: ${data.author}: ${messageContent} (${data.rank})`).setColor(`#7289da`)]}, channel)
    };

    async function handleFax(channel, data) {
        const embed = {
            title: `Fax from ${data.sender_name}`,
            desc: `Department: ${data.departament}\nMessage: ${data.message}\nAdmins: ${data.admins}`,
            color: `#3498db`
        };
        await client.embed(embed, channel)
    };

    async function handleLogin(channel, data) {
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle(` `).setDescription(`Admin Login: ${data.key}`).setColor(`#2ecc71`)]}, channel)
    };

    async function handleLogout(channel, data) {
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle(` `).setDescription(`Admin Logout: ${data.key}`).setColor(`#e74c3c`)]}, channel)
    };

    async function fetchPlayerById(playerId, database) {
        const players = await client.databaseRequest(database, "SELECT * FROM players WHERE id = ?", [playerId]);
        return players.length ? players[0] : null;
    };

    async function fetchJobBanByPlayerId(playerId, database) {
        const jobBans = await client.databaseRequest(database, "SELECT * FROM player_job_bans WHERE player_id = ?", [playerId]);
        return jobBans.length ? jobBans[0] : null;
    };

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    client.redisLogCallback = async function (data) {
    };
}