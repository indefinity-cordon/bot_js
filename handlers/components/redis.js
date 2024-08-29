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
                responded_game_server = game_server
                break
            }
        }

        if (!responded_game_server) {
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(`Failed to find server object. Aborting. data: ${data.source}, instance id: ${responded_instance.id}`));
            return;
        }

        const status = await client.databaseRequest(client.database, "SELECT channel_id, message_id, role_id FROM server_channels WHERE server_name = ? AND type = ?", [responded_game_server.server_name, data.type]);
        if (!status.length) {
            console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL`), chalk.red(`Failed to find server related feed channels. Aborting. data: ${JSON.stringify(data)}`));
            return;
        }

        const channel = await client.channels.fetch(status[0].channel_id);
        if (!channel) {
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(`Failed to find server related feed channels. Aborting. data: ${JSON.stringify(data)}`));
            return;
        }

        switch (data.state) {
            case "ooc":
                await handleOOC(channel, data);
                break;
            case "start":
                await handleRoundStart(channel);
                break;
            case "ahelp":
                await handleAhelp(channel, data);
                break;
            case "add_time_ban":
                await handleTimeBan(channel, data, "add");
                break;
            case "remove_time_ban":
                await handleTimeBan(channel, data, "remove");
                break;
            case "add_job_ban":
                await handleJobBan(channel, data, "add");
                break;
            case "remove_job_ban":
                await handleJobBan(channel, data, "remove");
                break;
            case "add_perma_ban":
                await handlePermaBan(channel, data, "add");
                break;
            case "remove_perma_ban":
                await handlePermaBan(channel, data, "remove");
                break;
            case "auto_unban":
                await handleAutoUnban(channel, data);
                break;
            case "auto_unjobban":
                await handleAutoUnjobban(channel, data);
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
    }

    async function handleOOC(channel, data) {
        const messageContent = data.message
            .replace(/<@!?(\d+)>/g, '@\u200b$1')
            .replace(/https?:\/\/\S+/g, '[link broken]');
        await client.embed({
            title: `OOC ${data.author}`,
            desc: messageContent,
            color: `#7289da`
        }, channel);
    }

    async function handleRoundStart(channel) {
        const role = channel.guild.roles.cache.find(role => role.name === `Round Alert`);
        const embed = {
            title: `NEW ROUND!`,
            desc: `<@&${role.id}>`,
            color: role.hexColor
        };

        await client.embed(embed, channel);
    }

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
        await client.embed(embed, channel);
    }

    async function handleTimeBan(channel, data, action) {
        const player = await fetchPlayerById(data.ref_player_id);
        const embed = {
            title: `Time Ban ${action === "add" ? "Added" : "Removed"}`,
            desc: `Player: ${player.ckey}\nReason: ${player.time_ban_reason}\nExpiration: ${formatTimestamp(player.time_ban_expiration)}`,
            color: action === "add" ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel);
    }

    async function handleJobBan(channel, data, action) {
        const player = await fetchPlayerById(data.ref_player_id);
        const jobBan = await fetchJobBanByPlayerId(data.ref_player_id);
        const embed = {
            title: `Job Ban ${action === "add" ? "Added" : "Removed"}`,
            desc: `Player: ${player.ckey}\nRole: ${jobBan.role}\nReason: ${jobBan.text}\nExpiration: ${formatTimestamp(jobBan.expiration)}`,
            color: action === "add" ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel);
    }

    async function handlePermaBan(channel, data, action) {
        const player = await fetchPlayerById(data.ref_player_id);
        const embed = {
            title: `Perma Ban ${action === "add" ? "Added" : "Removed"}`,
            desc: `Player: ${player.ckey}\nReason: ${player.permaban_reason}`,
            color: action === "add" ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel);
    }

    async function handleAutoUnban(channel, data) {
        const player = await fetchPlayerById(data.ref_player_id);
        const embed = {
            title: `Auto Unban`,
            desc: `Player: ${player.ckey} has been automatically unbanned.`,
            color: '#00ff00'
        };
        await client.embed(embed, channel);
    }

    async function handleAutoUnjobban(channel, data) {
        const player = await fetchPlayerById(data.ref_player_id);
        const embed = {
            title: `Auto Unjobban`,
            desc: `Player: ${player.ckey} has been automatically unjobbanned.`,
            color: '#00ff00'
        };
        await client.embed(embed, channel);
    }

    async function handleAsay(channel, data) {
        const embed = {
            title: `Asay of ${data.author}`,
            desc: `Message: ${data.message}\nRank: ${data.rank}`,
            color: `#261395`
        };
        await client.embed(embed, channel);
    }

    async function handleFax(channel, data) {
        const embed = {
            title: `Fax from ${data.sender_name}`,
            desc: `Department: ${data.departament}\nMessage: ${data.message}\nAdmins: ${data.admins}`,
            color: `#3498db`
        };
        await client.embed(embed, channel);
    }

    async function handleLogin(channel, data) {
        const embed = {
            title: `Admin Login`,
            desc: data.key,
            color: '#2ecc71'
        };
        await client.embed(embed, channel);
    }

    async function handleLogout(channel, data) {
        const embed = {
            title: `Admin Logout`,
            desc: data.key,
            color: '#e74c3c'
        };
        await client.embed(embed, channel);
    }

    async function fetchPlayerById(playerId) {
        const players = await client.databaseRequest(client.database, "SELECT * FROM players WHERE id = ?", [playerId]);
        return players.length ? players[0] : null;
    }

    async function fetchJobBanByPlayerId(playerId) {
        const jobBans = await client.databaseRequest(client.database, "SELECT * FROM player_job_bans WHERE player_id = ?", [playerId]);
        return jobBans.length ? jobBans[0] : null;
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }
}